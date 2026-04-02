"""
models/security_event.py — Eventos de seguridad del portal.

Registra intentos fallidos de login, bloqueos de IP y logins exitosos.
Solo se agregan registros, nunca se borran (historial de auditoría).
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String
from app.database import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id               = Column(Integer, primary_key=True, index=True)
    event_type       = Column(String(50), nullable=False, index=True)
    # Tipos: "login_failed" | "ip_blocked" | "ip_unblocked" | "login_success"
    ip_address       = Column(String(45), nullable=True, index=True)
    username_attempt = Column(String(100), nullable=True)   # usuario que intentaron usar
    details          = Column(String(500), nullable=True)   # info adicional
    created_at       = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    def __repr__(self):
        return f"<SecurityEvent type={self.event_type} ip={self.ip_address} at={self.created_at}>"
