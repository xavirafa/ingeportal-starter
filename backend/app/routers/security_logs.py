"""
routers/security_logs.py — Endpoints de logs de seguridad (solo admins).

Rutas:
  GET  /api/v1/security/events        — Lista de eventos recientes
  GET  /api/v1/security/stats         — Estadísticas del día
  GET  /api/v1/security/blocked-ips   — IPs actualmente bloqueadas en memoria
  GET  /api/v1/security/alerts        — Alertas activas para el admin (badge)
  POST /api/v1/security/unblock/{ip}  — Desbloquear manualmente una IP
"""

import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.security_event import SecurityEvent
from app.routers.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/security", tags=["Seguridad"])


@router.get("/events")
def listar_eventos(
    limit: int = Query(100, le=500),
    tipo: str = Query(None, description="Filtrar por tipo: login_failed, ip_blocked, login_success"),
    ip: str = Query(None, description="Filtrar por IP"),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Lista los eventos de seguridad más recientes."""
    query = db.query(SecurityEvent).order_by(desc(SecurityEvent.created_at))

    if tipo:
        query = query.filter(SecurityEvent.event_type == tipo)
    if ip:
        query = query.filter(SecurityEvent.ip_address == ip)

    eventos = query.limit(limit).all()

    return [
        {
            "id":               e.id,
            "event_type":       e.event_type,
            "ip_address":       e.ip_address,
            "username_attempt": e.username_attempt,
            "details":          e.details,
            "created_at":       e.created_at.isoformat() if e.created_at else None,
        }
        for e in eventos
    ]


@router.get("/stats")
def estadisticas(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Estadísticas de seguridad del día actual y últimas 24 horas."""
    ahora = datetime.now(timezone.utc)
    hace_24h = ahora - timedelta(hours=24)
    inicio_hoy = ahora.replace(hour=0, minute=0, second=0, microsecond=0)

    def contar(tipo, desde):
        return db.query(func.count(SecurityEvent.id)).filter(
            SecurityEvent.event_type == tipo,
            SecurityEvent.created_at >= desde,
        ).scalar() or 0

    # IPs únicas bloqueadas hoy
    ips_bloqueadas_hoy = db.query(SecurityEvent.ip_address).filter(
        SecurityEvent.event_type == "ip_blocked",
        SecurityEvent.created_at >= inicio_hoy,
    ).distinct().count()

    # IPs únicas con fallos en las últimas 24h
    ips_con_fallos = db.query(SecurityEvent.ip_address).filter(
        SecurityEvent.event_type == "login_failed",
        SecurityEvent.created_at >= hace_24h,
    ).distinct().count()

    # Usuario más atacado hoy
    usuario_mas_atacado = (
        db.query(SecurityEvent.username_attempt, func.count(SecurityEvent.id).label("total"))
        .filter(SecurityEvent.event_type == "login_failed", SecurityEvent.created_at >= inicio_hoy)
        .group_by(SecurityEvent.username_attempt)
        .order_by(desc("total"))
        .first()
    )

    return {
        "hoy": {
            "fallos":          contar("login_failed", inicio_hoy),
            "bloqueos":        contar("ip_blocked", inicio_hoy),
            "logins_exitosos": contar("login_success", inicio_hoy),
            "ips_bloqueadas":  ips_bloqueadas_hoy,
        },
        "ultimas_24h": {
            "fallos":          contar("login_failed", hace_24h),
            "bloqueos":        contar("ip_blocked", hace_24h),
            "logins_exitosos": contar("login_success", hace_24h),
            "ips_con_fallos":  ips_con_fallos,
        },
        "usuario_mas_atacado": usuario_mas_atacado[0] if usuario_mas_atacado else None,
        "generado_en": ahora.isoformat(),
    }


@router.get("/blocked-ips")
def ips_bloqueadas(
    _=Depends(require_admin),
):
    """Lista las IPs actualmente bloqueadas en memoria (bloqueo activo)."""
    from app.routers.auth import _bloqueadas

    ahora = datetime.now(timezone.utc)
    activas = []

    for ip, hasta in list(_bloqueadas.items()):
        if hasta is None:
            activas.append({"ip": ip, "bloqueada_hasta": None, "segundos_restantes": -1, "permanente": True})
        elif ahora < hasta:
            segundos = int((hasta - ahora).total_seconds())
            activas.append({"ip": ip, "bloqueada_hasta": hasta.isoformat(), "segundos_restantes": segundos, "permanente": False})

    return {"bloqueadas": activas, "total": len(activas)}


@router.post("/unblock/{ip_address}")
def desbloquear_ip(
    ip_address: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    """Desbloquea manualmente una IP y registra el evento."""
    from app.routers.auth import _bloqueadas, _fallos, _lock

    with _lock:
        estaba = ip_address in _bloqueadas
        _bloqueadas.pop(ip_address, None)
        _fallos.pop(ip_address, None)

    if estaba:
        evento = SecurityEvent(
            event_type="ip_unblocked",
            ip_address=ip_address,
            username_attempt=None,
            details=f"Desbloqueada manualmente por admin: {admin.username}",
        )
        db.add(evento)
        db.commit()
        logger.info(f"IP {ip_address} desbloqueada por admin {admin.username}")

    return {"ok": True, "ip": ip_address, "estaba_bloqueada": estaba}


@router.get("/alerts")
def alertas_activas(
    _=Depends(require_admin),
):
    """
    Resumen rápido de alertas activas para mostrar badge en el sidebar.
    Se llama periódicamente desde el frontend del admin.
    """
    from app.routers.auth import _bloqueadas, _ciclos_bloqueo

    ahora = datetime.now(timezone.utc)
    bloqueadas_activas = []

    for ip, hasta in list(_bloqueadas.items()):
        ciclo = _ciclos_bloqueo.get(ip, 1)
        if hasta is None:
            bloqueadas_activas.append({"ip": ip, "nivel": ciclo, "permanente": True})
        elif ahora < hasta:
            bloqueadas_activas.append({"ip": ip, "nivel": ciclo, "permanente": False})

    return {
        "bloqueadas": len(bloqueadas_activas),
        "permanentes": sum(1 for b in bloqueadas_activas if b["permanente"]),
        "detalle": bloqueadas_activas,
    }
