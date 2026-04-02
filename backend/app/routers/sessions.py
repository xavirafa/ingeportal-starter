"""
routers/sessions.py — Endpoints para sesiones activas e historial de conexiones.

Rutas disponibles (solo admins):
  GET    /api/v1/sessions/active                    → Ver sesiones activas
  DELETE /api/v1/sessions/force-logout/{session_id} → Forzar cierre de sesión
  DELETE /api/v1/sessions/force-logout-user/{user_id} → Cerrar todas las sesiones de un usuario
  GET    /api/v1/sessions/login-history             → Ver historial de conexiones
  GET    /api/v1/sessions/login-history/count        → Contar registros del historial
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import require_admin
from app.schemas.session import ActiveSessionResponse, LoginLogResponse
from app.services import auth_service

router = APIRouter(prefix="/sessions", tags=["Sesiones"])


@router.get("/active", response_model=list[ActiveSessionResponse])
def get_active_sessions(db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    Devuelve todas las sesiones activas.
    Solo administradores pueden ver esta informacion.
    """
    results = auth_service.get_all_active_sessions(db)

    # Cada resultado es una tupla (ActiveSession, username, full_name)
    return [
        ActiveSessionResponse(
            id=session.id,
            session_id=session.session_id,
            user_id=session.user_id,
            username=username,
            full_name=full_name,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            created_at=session.created_at,
            last_activity=session.last_activity,
        )
        for session, username, full_name in results
    ]


@router.get("/login-history", response_model=list[LoginLogResponse])
def get_login_history(
    limit: int = Query(default=50, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Devuelve el historial de conexiones (mas recientes primero).
    Solo administradores.
    """
    return auth_service.get_login_history(db, limit=limit, offset=offset)


@router.get("/login-history/count")
def get_login_history_count(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Devuelve el total de registros en el historial."""
    return {"count": auth_service.count_login_history(db)}


@router.delete("/force-logout/{session_id}")
def force_logout(session_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    Forzar cierre de sesión. Elimina la sesion activa.
    El usuario afectado recibira 401 en su siguiente request
    y sera redirigido al login automaticamente.
    """
    deleted = auth_service.delete_session(db, session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión no encontrada",
        )
    return {"message": "Sesión cerrada exitosamente"}


@router.delete("/force-logout-user/{user_id}")
def force_logout_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    Forzar cierre de TODAS las sesiones de un usuario.
    """
    count = auth_service.delete_user_sessions(db, user_id)
    return {"message": f"Se cerraron {count} sesión(es)"}
