"""
schemas/user.py — Schemas Pydantic para validacion de datos de usuario.
"""

from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import Optional, List


class UserCreate(BaseModel):
    full_name:    str
    username:     str
    password:     str
    email:        Optional[str] = None   # opcional
    role:         str = "user"
    allowed_apps: List[str] = []         # apps habilitadas al crear

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        """Valida que la contraseña tenga al menos 8 caracteres."""
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v


class UserResponse(BaseModel):
    id:           int
    full_name:    str
    username:     str
    email:        Optional[str]
    role:         str
    is_active:    bool
    allowed_apps: List[str] = []
    created_at:   datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str   # acepta nombre de usuario
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserResponse
