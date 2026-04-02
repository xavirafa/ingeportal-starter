"""
routers/users.py — Endpoints de gestion de usuarios (solo admins).

Rutas:
  GET    /api/v1/users          -> listar todos los usuarios
  POST   /api/v1/users          -> crear usuario
  PATCH  /api/v1/users/{id}     -> actualizar rol o estado
  DELETE /api/v1/users/{id}     -> desactivar usuario (no se borra, se desactiva)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service
from app.routers.auth import require_admin
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/users", tags=["Usuarios"])


class UserUpdate(BaseModel):
    full_name:    Optional[str]       = None
    role:         Optional[str]       = None
    is_active:    Optional[bool]      = None
    password:     Optional[str]       = None
    allowed_apps: Optional[List[str]] = None  # lista de IDs de apps permitidas


@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Listar todos los usuarios del sistema. Solo admins."""
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Crear un nuevo usuario. Solo admins."""
    existing = auth_service.get_user_by_username(db, user_data.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese nombre de usuario",
        )
    return auth_service.create_user(db, user_data)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Actualizar nombre, rol, estado o contrasena de un usuario. Solo admins."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # No permitir que un admin se desactive a si mismo
    if user_id == current_user.id and data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivarte a ti mismo",
        )

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password is not None:
        user.hashed_password = auth_service.hash_password(data.password)
    if data.allowed_apps is not None:
        user.allowed_apps = data.allowed_apps

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Desactivar un usuario (no se elimina de la BD). Solo admins."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivarte a ti mismo",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.is_active = False
    db.commit()
