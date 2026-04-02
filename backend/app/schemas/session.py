"""
schemas/session.py — Schemas Pydantic para sesiones activas e historial de login.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ActiveSessionResponse(BaseModel):
    """Respuesta para una sesion activa."""
    id: int
    session_id: str
    user_id: int
    username: str          # se agrega en el endpoint, no viene del modelo
    full_name: str         # se agrega en el endpoint, no viene del modelo
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    last_activity: datetime


class LoginLogResponse(BaseModel):
    """Respuesta para un registro del historial de conexiones."""
    id: int
    user_id: int
    username: str
    full_name: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    logged_in_at: datetime

    class Config:
        from_attributes = True
