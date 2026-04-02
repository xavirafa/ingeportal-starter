"""
models/session.py — Modelo de sesiones activas.

Cada login crea un registro aqui. Si se borra (force-logout),
el token JWT queda invalido porque get_current_user verifica que exista.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey
from app.database import Base


class ActiveSession(Base):
    __tablename__ = "active_sessions"

    id            = Column(Integer, primary_key=True, index=True)
    session_id    = Column(String(36), unique=True, index=True, nullable=False)  # UUID en el JWT
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address    = Column(String(45), nullable=True)   # IPv4 o IPv6
    user_agent    = Column(String(300), nullable=True)   # navegador/dispositivo
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_activity = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<ActiveSession sid={self.session_id} user_id={self.user_id}>"
