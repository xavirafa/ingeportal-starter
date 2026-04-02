"""
create_admin.py — Crea el primer usuario administrador sin necesitar la interfaz web
Uso: python create_admin.py

Requiere que la BD ya exista y las tablas estén creadas
(ejecutar la app una vez primero, o aplicar 0001_initial_schema.sql manualmente).
"""

import sys
import os

# Asegurar que el modulo app sea encontrable
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.services.auth_service import create_user, get_user_by_username
from app.schemas.user import UserCreate

def main():
    print("\n=== Crear usuario administrador ===\n")

    username  = input("Usuario (sin espacios): ").strip()
    full_name = input("Nombre completo: ").strip()
    email     = input("Correo electronico (Enter para omitir): ").strip() or None

    # Pedir contrasena dos veces para confirmar
    import getpass
    password  = getpass.getpass("Contrasena: ")
    password2 = getpass.getpass("Confirmar contrasena: ")

    if password != password2:
        print("\nError: las contrasenas no coinciden.")
        sys.exit(1)

    if len(password) < 6:
        print("\nError: la contrasena debe tener al menos 6 caracteres.")
        sys.exit(1)

    db = SessionLocal()
    try:
        # Verificar que el usuario no exista
        existing = get_user_by_username(db, username)
        if existing:
            print(f"\nError: ya existe un usuario con el username '{username}'.")
            sys.exit(1)

        # Crear el usuario con rol admin
        user_data = UserCreate(
            username=username,
            full_name=full_name,
            email=email,
            password=password,
            role="admin",
        )
        user = create_user(db, user_data)

        print(f"\nUsuario administrador creado exitosamente:")
        print(f"  ID:       {user.id}")
        print(f"  Usuario:  {user.username}")
        print(f"  Nombre:   {user.full_name}")
        print(f"  Rol:      {user.role}")
        print(f"\nYa puedes iniciar sesion en el portal.\n")

    except Exception as e:
        print(f"\nError al crear el usuario: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
