"""
services/auth_service.py — Logica de autenticacion y manejo de sesiones.
"""

import uuid
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.models.session import ActiveSession
from app.models.login_log import LoginLog
from app.schemas.user import UserCreate


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, data: UserCreate) -> User:
    db_user = User(
        full_name=data.full_name,
        username=data.username.lower().strip(),
        email=data.email or None,
        hashed_password=hash_password(data.password),
        role=data.role,
        allowed_apps=data.allowed_apps,  # guardar las apps habilitadas al crear
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    """Autentica por username (o email si contiene @)."""
    if "@" in username:
        user = get_user_by_email(db, username)
    else:
        user = get_user_by_username(db, username.lower().strip())

    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ─── Sesiones activas ────────────────────────────────────────────────────────

def create_session(db: Session, user_id: int, ip: str | None, user_agent: str | None) -> str:
    """
    Crea una sesion activa y devuelve el session_id (UUID).
    Elimina sesiones anteriores del mismo usuario para que solo haya una activa.
    """
    # Limpiar sesiones anteriores del usuario (solo 1 sesión activa por usuario)
    db.query(ActiveSession).filter(ActiveSession.user_id == user_id).delete()

    sid = str(uuid.uuid4())
    session = ActiveSession(
        session_id=sid,
        user_id=user_id,
        ip_address=ip,
        user_agent=user_agent[:300] if user_agent else None,
    )
    db.add(session)
    db.commit()
    return sid


def get_session_by_sid(db: Session, sid: str) -> ActiveSession | None:
    """Busca una sesion activa por su session_id."""
    return db.query(ActiveSession).filter(ActiveSession.session_id == sid).first()


def update_last_activity(db: Session, session: ActiveSession) -> None:
    """Actualiza la ultima actividad de la sesion."""
    session.last_activity = datetime.now(timezone.utc)
    db.commit()


def delete_session(db: Session, session_id: str) -> bool:
    """Elimina una sesion activa (force-logout). Devuelve True si existia."""
    rows = db.query(ActiveSession).filter(ActiveSession.session_id == session_id).delete()
    db.commit()
    return rows > 0


def delete_user_sessions(db: Session, user_id: int) -> int:
    """Elimina todas las sesiones de un usuario. Devuelve cuantas se borraron."""
    rows = db.query(ActiveSession).filter(ActiveSession.user_id == user_id).delete()
    db.commit()
    return rows


def get_all_active_sessions(db: Session) -> list:
    """Devuelve todas las sesiones activas con datos del usuario."""
    return (
        db.query(ActiveSession, User.username, User.full_name)
        .join(User, ActiveSession.user_id == User.id)
        .order_by(ActiveSession.last_activity.desc())
        .all()
    )


# ─── Historial de conexiones ─────────────────────────────────────────────────

def log_login(db: Session, user: User, ip: str | None, user_agent: str | None) -> None:
    """Registra un login en el historial."""
    entry = LoginLog(
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        ip_address=ip,
        user_agent=user_agent[:300] if user_agent else None,
    )
    db.add(entry)
    db.commit()


def get_login_history(db: Session, limit: int = 100, offset: int = 0) -> list[LoginLog]:
    """Devuelve el historial de conexiones, mas recientes primero."""
    return (
        db.query(LoginLog)
        .order_by(LoginLog.logged_in_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def count_login_history(db: Session) -> int:
    """Cuenta el total de registros en el historial."""
    return db.query(LoginLog).count()
