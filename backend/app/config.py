"""
config.py - Configuracion central de la aplicacion.
Lee las variables del archivo .env y las expone como un objeto de configuracion.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Clase de configuracion. Pydantic lee automaticamente las variables
    del archivo .env y las valida.
    """

    # API moderna de pydantic-settings v2: usar model_config en lugar de class Config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignora variables que no esten definidas aqui
    )

    # Informacion de la aplicacion
    app_name: str = "Mi Portal"
    app_version: str = "0.1.0"
    debug: bool = True

    # Base de datos PostgreSQL
    database_url: str

    # JWT (autenticacion)
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 480


# Instancia unica de configuracion (se importa desde otros modulos)
settings = Settings()
