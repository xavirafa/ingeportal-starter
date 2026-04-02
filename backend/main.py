"""
main.py — Punto de entrada del backend (API FastAPI).
Para iniciar el servidor: uvicorn main:app --reload
"""

import logging

# Configurar logging global
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, sessions, security_logs
from app.models import session as session_model, login_log, security_event  # noqa: F401 — registra tablas en SQLAlchemy

# Crear todas las tablas en PostgreSQL al iniciar (si no existen)
Base.metadata.create_all(bind=engine)

# Crear la aplicación FastAPI
# En producción (DEBUG=False) se ocultan los docs de la API
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=f"API de {settings.app_name} — Backend con FastAPI",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# --- CORS (permite que el frontend en :5173 hable con el backend en :8000) ---
# Ajusta allow_origins con las IPs/URLs de tu servidor
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        # Agrega aqui la IP de tu servidor de produccion:
        # "http://192.168.x.x:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Middleware de headers de seguridad HTTP ---
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Agrega headers de seguridad a todas las respuestas."""
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# --- Registrar routers base ---
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(security_logs.router)  # ya tiene prefix /api/v1/security

# --- AQUI vas a agregar tus routers de nuevas apps ---
# Ejemplo:
# from app.routers import mi_app
# app.include_router(mi_app.router, prefix="/api/v1")


# --- Endpoints de salud ---
@app.get("/", tags=["root"])
async def root():
    """Endpoint raíz — verifica que el servidor está corriendo."""
    return {
        "message": f"Bienvenido al {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health", tags=["root"])
async def health_check():
    """Endpoint de salud."""
    return {"status": "ok"}
