"""
models/user.py — Modelo de la tabla 'users' en PostgreSQL.
"""

from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String, JSON
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    full_name       = Column(String(100), nullable=False)
    username        = Column(String(50), unique=True, index=True, nullable=False)
    email           = Column(String(150), unique=True, index=True, nullable=True)  # opcional
    hashed_password = Column(String(255), nullable=False)
    role            = Column(String(20), nullable=False, default="user")
    is_active       = Column(Boolean, default=True)
    allowed_apps    = Column(JSON, nullable=True, default=list)  # lista de IDs de apps permitidas
    created_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<User id={self.id} username={self.username} role={self.role}>"
