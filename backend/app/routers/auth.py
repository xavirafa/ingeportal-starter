"""
routers/auth.py — Endpoints de autenticación.

Rutas disponibles:
  POST /api/v1/auth/login    → Iniciar sesión, recibe username+clave, devuelve JWT
  POST /api/v1/auth/register → Registrar nuevo usuario (solo admins)
  GET  /api/v1/auth/me       → Obtener datos del usuario actual (requiere token)
  POST /api/v1/auth/logout   → Cerrar sesión (elimina sesión activa)
"""

import logging
import threading
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.services import auth_service

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Rate limiting progresivo: 3 fallos → bloqueo que crece con cada reincidencia
# Ciclo 1 → 5 min | Ciclo 2 → 15 min | Ciclo 3 → 1 hora | Ciclo 4+ → permanente
# ──────────────────────────────────────────────────────────────────────────────
MAX_FALLOS = 3
DURACIONES_BLOQUEO = [5, 15, 60, None]  # minutos; None = permanente

_fallos: dict          = defaultdict(list)  # IP -> [timestamps de fallos recientes]
_bloqueadas: dict      = {}                 # IP -> datetime hasta cuando está bloqueada (None = permanente)
_ciclos_bloqueo: dict  = defaultdict(int)   # IP -> cuántas veces ha sido bloqueada
_lock = threading.Lock()


def _get_client_ip(req: Request) -> str:
    """
    Obtiene la IP real del cliente en formato IPv4 limpio.
    Vite proxy pasa X-Forwarded-For con la IP original — la usamos primero.
    Sin ese header (acceso directo), usamos req.client.host.
    Elimina el prefijo ::ffff: que Node.js agrega a IPs IPv4.
    """
    forwarded = req.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (req.client.host if req.client else "unknown")
    # Normalizar IPv4-mapped IPv6: ::ffff:192.168.1.1 → 192.168.1.1
    if ip.startswith("::ffff:"):
        ip = ip[7:]
    return ip


def _duracion_bloqueo(ciclo: int) -> tuple[int | None, str]:
    """Devuelve (minutos, descripción) según el ciclo de bloqueo."""
    idx = min(ciclo, len(DURACIONES_BLOQUEO) - 1)
    minutos = DURACIONES_BLOQUEO[idx]
    if minutos is None:
        return None, "permanente (desbloqueo manual requerido)"
    if minutos < 60:
        return minutos, f"{minutos} minutos"
    return minutos, f"{minutos // 60} hora{'s' if minutos // 60 > 1 else ''}"


def _verificar_ip_bloqueada(req: Request):
    """
    Dependencia: verifica si la IP está bloqueada antes de procesar el login.
    Si el bloqueo temporal expiró lo limpia; el permanente requiere admin.
    """
    ip = _get_client_ip(req)
    ahora = datetime.now(timezone.utc)

    with _lock:
        if ip in _bloqueadas:
            hasta = _bloqueadas[ip]
            if hasta is None:
                # Bloqueo permanente
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Acceso bloqueado permanentemente. Contacta al administrador.",
                )
            if ahora < hasta:
                minutos = int((hasta - ahora).total_seconds() // 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Demasiados intentos fallidos. Intenta de nuevo en {minutos} minuto{'s' if minutos != 1 else ''}.",
                )
            else:
                # Bloqueo temporal expirado — limpiar fallos pero conservar el ciclo
                del _bloqueadas[ip]
                _fallos.pop(ip, None)


def _registrar_fallo(ip: str, db: Session, username_attempt: str):
    """
    Registra un intento fallido con bloqueo progresivo.
    Retorna el número de fallos actuales para construir el mensaje al usuario.
    """
    from app.models.security_event import SecurityEvent

    ahora = datetime.now(timezone.utc)

    with _lock:
        # Ventana de fallos = duración del bloqueo actual del ciclo
        ciclo_actual = _ciclos_bloqueo[ip]
        idx = min(ciclo_actual, len(DURACIONES_BLOQUEO) - 1)
        mins_ventana = DURACIONES_BLOQUEO[idx] or 60
        ventana = timedelta(minutes=mins_ventana)

        _fallos[ip] = [t for t in _fallos[ip] if ahora - t < ventana]
        _fallos[ip].append(ahora)
        fallos_actuales = len(_fallos[ip])

    # Guardar fallo en BD
    db.add(SecurityEvent(
        event_type="login_failed",
        ip_address=ip,
        username_attempt=username_attempt,
        details=f"Intento fallido #{fallos_actuales} (ciclo de bloqueo {ciclo_actual + 1})",
    ))

    # Si alcanzó el límite, aplicar el siguiente nivel de bloqueo
    if fallos_actuales >= MAX_FALLOS:
        with _lock:
            nuevo_ciclo = _ciclos_bloqueo[ip]  # puede haber cambiado
            minutos, desc = _duracion_bloqueo(nuevo_ciclo)
            hasta = (ahora + timedelta(minutes=minutos)) if minutos else None
            _bloqueadas[ip] = hasta
            _ciclos_bloqueo[ip] = nuevo_ciclo + 1
            _fallos.pop(ip, None)

        tipo = "ip_blocked_permanent" if minutos is None else "ip_blocked"
        db.add(SecurityEvent(
            event_type=tipo,
            ip_address=ip,
            username_attempt=username_attempt,
            details=f"Bloqueada {desc} — ciclo {nuevo_ciclo + 1}",
        ))
        logger.warning(f"SEGURIDAD — IP bloqueada: {ip} | ciclo {nuevo_ciclo + 1} | duracion: {desc} | usuario: {username_attempt}")

    db.commit()
    return fallos_actuales


def _registrar_login_exitoso(ip: str, db: Session, username: str):
    """Limpia los fallos de la IP y registra el login exitoso."""
    from app.models.security_event import SecurityEvent

    with _lock:
        _fallos.pop(ip, None)
        _bloqueadas.pop(ip, None)

    evento = SecurityEvent(
        event_type="login_success",
        ip_address=ip,
        username_attempt=username,
        details="Login exitoso",
    )
    db.add(evento)
    db.commit()

# Prefijo: todas las rutas de este router empiezan con /auth
router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Esquema de seguridad: espera un header "Authorization: Bearer <token>"
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Dependencia reutilizable: extrae y valida el token JWT del header.
    Tambien verifica que la sesion (sid) exista en active_sessions
    y actualiza last_activity.
    """
    token = credentials.credentials
    payload = auth_service.decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    # Verificar que la sesion siga activa (si el token tiene sid)
    sid = payload.get("sid")
    if sid:
        session = auth_service.get_session_by_sid(db, sid)
        if session is None:
            # La sesion fue eliminada (force-logout) → token invalido
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesión cerrada",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Actualizar ultima actividad
        auth_service.update_last_activity(db, session)

    user = auth_service.get_user_by_id(db, user_id=int(user_id))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    return user


def require_admin(current_user=Depends(get_current_user)):
    """Dependencia: verifica que el usuario logueado sea administrador."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador",
        )
    return current_user


def require_app(app_id: str):
    """
    Dependencia factory: verifica que el usuario tenga permiso para la app indicada.
    Los admins siempre tienen acceso completo.
    Los usuarios normales necesitan tener el app_id en su campo allowed_apps.
    Uso: _=Depends(require_app("mi_app"))
    """
    def _check(current_user=Depends(get_current_user)):
        if current_user.role == "admin":
            return current_user
        if not current_user.allowed_apps or app_id not in current_user.allowed_apps:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a esta aplicación.",
            )
        return current_user
    return _check


@router.post("/login", response_model=TokenResponse)
def login(
    request_data: LoginRequest,
    req: Request,
    db: Session = Depends(get_db),
    _=Depends(_verificar_ip_bloqueada),
):
    """
    Iniciar sesión.
    Recibe username y contraseña, devuelve un token JWT si las credenciales son correctas.
    Tambien crea una sesion activa y registra el login en el historial.
    Después de 3 intentos fallidos, la IP queda bloqueada 5 minutos.
    """
    ip = _get_client_ip(req)
    user = auth_service.authenticate_user(db, request_data.username, request_data.password)

    if not user:
        fallos = _registrar_fallo(ip, db, request_data.username)
        restantes = MAX_FALLOS - fallos
        if restantes <= 0:
            # Acaba de bloquearse — calcular cuánto tiempo
            with _lock:
                ciclo = _ciclos_bloqueo[ip]
            _, desc = _duracion_bloqueo(ciclo - 1)
            detail = f"Demasiados intentos fallidos. IP bloqueada {desc}."
        elif restantes == 1:
            detail = "Usuario o contraseña incorrectos. Cuidado! Te queda 1 intento antes de bloquearte."
        else:
            detail = f"Usuario o contraseña incorrectos. Te quedan {restantes} intentos."
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    # Login exitoso: limpiar contador de fallos
    _registrar_login_exitoso(ip, db, request_data.username)

    # Obtener User-Agent del request
    user_agent = req.headers.get("user-agent")

    # Crear sesion activa y obtener el session_id
    sid = auth_service.create_session(db, user.id, ip, user_agent)

    # Registrar en el historial de conexiones
    auth_service.log_login(db, user, ip, user_agent)

    # Crear token con el ID del usuario, session_id y rol
    token = auth_service.create_access_token(data={"sub": str(user.id), "sid": sid, "role": user.role})

    return TokenResponse(access_token=token, user=user)


@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Cerrar sesión: elimina la sesion activa del usuario.
    El token queda invalido porque ya no existe la sesion.
    """
    token = credentials.credentials
    payload = auth_service.decode_token(token)

    if payload and payload.get("sid"):
        auth_service.delete_session(db, payload["sid"])

    return {"message": "Sesión cerrada"}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    Registrar un nuevo usuario.
    Solo los administradores pueden crear usuarios.
    """
    # Verificar que el email no esté ya registrado
    existing = auth_service.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese email",
        )

    return auth_service.create_user(db, user_data)


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    """
    Obtener datos del usuario autenticado.
    El frontend lo usa para saber quién está logueado.
    """
    return current_user
