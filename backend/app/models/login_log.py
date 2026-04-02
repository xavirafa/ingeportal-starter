"""
models/login_log.py — Historial de conexiones (append-only).

Cada vez que alguien hace login, se inserta un registro aqui.
Nunca se borran registros, solo se agregan.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String
from app.database import Base


class LoginLog(Base):
    __tablename__ = "login_log"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, nullable=False, index=True)
    username     = Column(String(50), nullable=False)
    full_name    = Column(String(100), nullable=False)
    ip_address   = Column(String(45), nullable=True)
    user_agent   = Column(String(300), nullable=True)
    logged_in_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<LoginLog user={self.username} at={self.logged_in_at}>"
