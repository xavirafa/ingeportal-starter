# SETUP.md — Guia de instalacion desde cero

Sigue estos pasos en orden para tener el portal corriendo en un servidor Windows.

---

## Requisitos previos

- Windows Server 2019/2022 (o Windows 10/11)
- Python 3.11+ instalado (`python --version`)
- Node.js 20+ instalado (`node --version`)
- PostgreSQL 15+ instalado y corriendo
- Git instalado
- NSSM instalado (para servicios Windows): `choco install nssm` o desde https://nssm.cc

---

## Paso 1 — Clonar el repositorio

```powershell
cd C:\Users\TU_USUARIO
git clone https://github.com/TU_ORG/TU_REPO.git miproyecto
cd miproyecto
git checkout dev
```

---

## Paso 2 — Crear las bases de datos PostgreSQL

Conectarse a PostgreSQL como superusuario y ejecutar:

```sql
-- Crear usuario dedicado para la app
CREATE USER miproyecto_app WITH PASSWORD 'TuPasswordSegura';

-- BD de produccion
CREATE DATABASE miproyecto OWNER miproyecto_app;
GRANT ALL PRIVILEGES ON DATABASE miproyecto TO miproyecto_app;

-- BD de desarrollo
CREATE DATABASE miproyecto_dev OWNER miproyecto_app;
GRANT ALL PRIVILEGES ON DATABASE miproyecto_dev TO miproyecto_app;

-- Permisos de schema (PostgreSQL 17+)
\c miproyecto
GRANT ALL ON SCHEMA public TO miproyecto_app;

\c miproyecto_dev
GRANT ALL ON SCHEMA public TO miproyecto_app;
```

Luego aplicar el esquema inicial en ambas BDs:

```powershell
psql -U miproyecto_app -d miproyecto    -f migrations\0001_initial_schema.sql
psql -U miproyecto_app -d miproyecto_dev -f migrations\0001_initial_schema.sql
```

---

## Paso 3 — Configurar el backend

```powershell
cd backend
pip install -r requirements.txt
```

Crear el archivo `.env` copiando el ejemplo:

```powershell
copy .env.example .env
```

Editar `backend\.env` con tus valores reales:

```env
DATABASE_URL=postgresql://miproyecto_app:TuPasswordSegura@localhost:5432/miproyecto
JWT_SECRET_KEY=genera-una-clave-aleatoria-larga-aqui
JWT_EXPIRATION_MINUTES=480
APP_NAME=Mi Portal
```

Para generar un JWT_SECRET_KEY aleatorio:
```python
python -c "import secrets; print(secrets.token_hex(32))"
```

Editar `backend\run-backend.bat` y `backend\run-backend-dev.bat` con la ruta correcta al entorno Python.

---

## Paso 4 — Crear el primer usuario administrador

Con el backend configurado, ejecutar:

```powershell
cd backend
python create_admin.py
```

Sigue las instrucciones en pantalla. Este usuario admin puede luego crear mas usuarios desde la interfaz web.

---

## Paso 5 — Configurar el frontend

```powershell
cd frontend
npm install
```

Verificar que `vite.config.js` apunte a los puertos correctos (8000 para prod, 8001 para dev).

---

## Paso 6 — Configurar Nginx

1. Descargar Nginx para Windows desde https://nginx.org/en/download.html
2. Descomprimir en `nginx\` dentro del directorio del proyecto
3. Editar `nginx\conf\nginx.conf`:
   - Cambiar `root` a la ruta real de `frontend\dist\`
   - Ajustar el puerto en `listen` si es necesario

---

## Paso 7 — Instalar servicios Windows con NSSM

Editar `install-services.ps1` con las rutas y nombres de servicio correctos, luego ejecutar como administrador:

```powershell
Set-ExecutionPolicy Bypass -Scope Process
.\install-services.ps1
```

Esto instala y arranca:
- `MiProyectoBackend` — FastAPI en puerto 8000
- `MiProyectoFrontend` — Vite dev server (para desarrollo)

Para produccion, Nginx sirve el frontend compilado en lugar del Vite dev server.

---

## Paso 8 — Primer deploy a produccion

```powershell
# Construir el frontend
cd frontend
npm run build
cd ..

# Iniciar Nginx
Start-Process nginx\nginx.exe -WorkingDirectory nginx\

# O usar deploy.ps1 (configurar primero las rutas en el script)
.\deploy.ps1
```

Verificar en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/docs

---

## Estructura de servicios

| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| Backend prod | 8000 | FastAPI — `run-backend.bat` |
| Backend dev  | 8001 | FastAPI dev — `run-backend-dev.bat` |
| Frontend dev | 5175 | Vite con hot reload |
| Nginx (prod) | 5173 | Sirve `frontend/dist/` |

---

## Comandos utiles

```powershell
# Ver estado de servicios
nssm status MiProyectoBackend

# Reiniciar backend
nssm restart MiProyectoBackend

# Ver logs del backend
Get-Content backend\logs\service.log -Tail 50 -Wait

# Sincronizar BD dev <- prod
.\sync_dev.ps1

# Deploy a produccion
.\deploy.ps1 -Force
```
