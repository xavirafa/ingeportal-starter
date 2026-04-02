"""
database.py — Conexión a PostgreSQL usando SQLAlchemy.

SQLAlchemy es un ORM (Object-Relational Mapper): nos permite trabajar con la base
de datos usando clases Python en lugar de escribir SQL directamente.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings


# Motor de la base de datos — es la conexión real a PostgreSQL
engine = create_engine(
    settings.database_url,
    echo=settings.debug,  # Si debug=True, imprime cada query SQL en consola
)

# Fábrica de sesiones — cada "sesión" es una transacción con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para todos los modelos SQLAlchemy
# Todos los modelos de tablas heredarán de esta clase
Base = declarative_base()


def get_db():
    """
    Generador de sesiones de base de datos.
    Se usa como dependencia en FastAPI (Dependency Injection).
    Garantiza que la sesión se cierre correctamente después de cada request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
