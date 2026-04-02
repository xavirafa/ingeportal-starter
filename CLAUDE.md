# CLAUDE.md — Portal Starter

> **Para Claude Code:** Lee este archivo completo al inicio de cada sesión. Contiene todo lo necesario para trabajar de forma autónoma en este proyecto sin preguntar lo obvio.

---

## 1. CONTEXTO DEL PROYECTO

**Descripcion:** Portal interno con autenticacion JWT, panel admin, y sistema dev/prod.

> Actualizar esta seccion con los detalles reales del proyecto:
> - Nombre del proyecto
> - Empresa / desarrollador
> - Descripcion del negocio
> - Servidor y dominio

### Reglas de colaboracion
1. Explica que vas a hacer antes de hacerlo.
2. Un paso a la vez.
3. Despues de cada cambio, di como verificar que funciona.
4. Comenta el codigo en español.
5. No borres codigo sin explicar por que.
6. Sugiere commit despues de completar una funcionalidad.
7. "actualiza y sube" = actualizar memoria + git commit + git push sin pedir confirmacion.

---

## 2. STACK TECNOLOGICO

### Backend
- **Python 3.11+** + **FastAPI** + **Uvicorn**
- **SQLAlchemy** (ORM para PostgreSQL)
- **JWT** con `python-jose` — autenticacion y roles
- **slowapi** — rate limiting contra fuerza bruta
- **pydantic-settings** — variables de entorno desde `.env`

### Frontend
- **React 19** + **Vite 7**
- **Tailwind CSS 4**
- **React Router 7**
- **Axios** (cliente HTTP)

### Base de datos
- **PostgreSQL** — produccion y desarrollo (BDs separadas)

---

## 3. ARQUITECTURA DEV / PROD

### Puertos

| Entorno | Puerto | Servicio | BD |
|---------|--------|----------|----|
| Produccion frontend | 5173 | Nginx (sirve dist/) | miproyecto |
| Produccion backend  | 8000 | NSSM + run-backend.bat | miproyecto |
| Desarrollo frontend | 5175 | Vite hot reload | miproyecto_dev |
| Desarrollo backend  | 8001 | NSSM + run-backend-dev.bat | miproyecto_dev |

### Ramas Git
- `dev` → desarrollo activo. Todo trabajo va aqui.
- `main` → produccion. Solo se actualiza via `deploy.ps1`.

### Proxy Vite (vite.config.js)
```js
// VITE_PORT=5175 → apunta al backend dev (8001)
// cualquier otro → apunta al backend prod (8000)
```

---

## 4. ESTRUCTURA DE ARCHIVOS

```
miproyecto/
├── CLAUDE.md
├── SETUP.md
├── deploy.ps1
├── sync_dev.ps1
├── install-services.ps1
├── admin-run.ps1
├── .gitignore
│
├── backend/
│   ├── main.py                   # Punto de entrada FastAPI
│   ├── requirements.txt
│   ├── .env                      # Variables de entorno (NO va a Git)
│   ├── .env.example              # Plantilla de variables
│   ├── create_admin.py           # Script para crear primer admin
│   ├── run-backend.bat           # Inicia uvicorn prod (puerto 8000)
│   ├── run-backend-dev.bat       # Inicia uvicorn dev (puerto 8001)
│   ├── apply_migrations.py       # Aplica migraciones SQL pendientes
│   └── app/
│       ├── config.py             # Settings (pydantic-settings)
│       ├── database.py           # Conexion SQLAlchemy
│       ├── models/               # Modelos SQLAlchemy
│       │   ├── user.py
│       │   ├── session.py
│       │   ├── security_event.py
│       │   └── login_log.py
│       ├── schemas/              # Schemas Pydantic
│       ├── routers/              # Endpoints de la API
│       │   ├── auth.py           # Login, logout, register, /me
│       │   ├── users.py          # CRUD usuarios (admin)
│       │   ├── sessions.py       # Sesiones activas (admin)
│       │   └── security_logs.py  # Logs de seguridad (admin)
│       ├── services/
│       │   └── auth_service.py   # Logica de autenticacion
│       └── middleware/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx               # Router principal
│       ├── api/client.js         # Axios con JWT automatico
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       ├── components/
│       │   ├── Layout.jsx        # Sidebar + header
│       │   ├── ProtectedRoute.jsx
│       │   ├── ConfirmDialog.jsx
│       │   └── UndoToast.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   └── admin/
│       │       ├── Users.jsx
│       │       └── SecurityLogs.jsx
│       └── hooks/
│           └── useAuth.js
│
├── migrations/
│   ├── README.md
│   └── 0001_initial_schema.sql
│
└── nginx/
    └── conf/
        └── nginx.conf
```

---

## 5. CHECKLIST — AGREGAR UNA NUEVA APP

Cada vez que se crea una nueva app, actualizar **exactamente estos 5 archivos**:

```
1. frontend/src/pages/admin/Users.jsx
   → Agregar { id: 'mi_app', label: 'Mi App' } al array PORTAL_APPS

2. frontend/src/pages/Dashboard.jsx
   → Agregar la tarjeta al array APPS

3. frontend/src/App.jsx
   → Agregar la <Route path="/apps/mi-app" element={<MiApp />} />

4. frontend/src/components/Layout.jsx
   → Agregar a NAV_GROUPS el item de navegacion

5. backend/main.py
   → Importar y registrar el router con app.include_router(...)
```

> Son 5 archivos. El sidebar (Layout.jsx) se olvida facil.

---

## 6. SEGURIDAD IMPLEMENTADA

- JWT con expiracion (480 min por defecto)
- Contrasenas hasheadas con bcrypt
- Roles: `admin` y `user`
- Blacklist de tokens al hacer logout (tabla active_sessions)
- Rate limiting progresivo (slowapi): 3 fallos → bloqueo temporal, escala a permanente
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Panel de logs de seguridad: `/admin/seguridad` (solo admins)
- Sesiones activas con force-logout desde el panel admin

---

## 7. CONVENCIONES DE CODIGO

### Python
```python
# Variables y funciones: snake_case en ingles
# Clases: PascalCase
# Constantes: UPPER_CASE
# Comentarios: en espanol
# Type hints: siempre
```

### JavaScript/React
```jsx
// Variables y funciones: camelCase
// Componentes: PascalCase, archivo PascalCase.jsx
// Hooks: prefijo use
// Comentarios: en espanol
// Estilos: inline styles con CSS variables para tema
style={{ color: 'var(--text-primary)' }}
```

### Git
```
Commits en espanol, formato: tipo: descripcion breve
tipos: feat: / fix: / docs: / style: / refactor: / test:
```

---

## 8. COMANDOS DE REFERENCIA RAPIDA

```powershell
# Desarrollo
git checkout dev && git pull origin dev
git add . && git commit -m "feat: ..." && git push origin dev

# Deploy a produccion
.\deploy.ps1 -Force

# Servicios
nssm status MiProyectoBackend
nssm restart MiProyectoBackend

# Sync BD dev <- prod
.\sync_dev.ps1 -Force

# Logs
Get-Content backend\logs\service.log -Tail 50 -Wait
```

---

## 9. VARIABLES DE ENTORNO (backend/.env)

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/miproyecto
JWT_SECRET_KEY=clave-secreta-larga-y-aleatoria
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=480
APP_NAME=Mi Portal
APP_VERSION=1.0.0
DEBUG=true
```

---

## 10. MIGRACIONES DE BASE DE DATOS

```bash
# Crear archivo en /migrations/ con nombre numerado
# Ejemplo: 0002_agregar_columna_telefono.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

# El deploy la aplica automaticamente via apply_migrations.py
```

---

## 11. PATRONES IMPORTANTES

### Agregar un nuevo router en el backend

```python
# 1. Crear backend/app/routers/mi_app.py
from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user

router = APIRouter(prefix="/mi-app", tags=["Mi App"])

@router.get("/")
async def get_data(current_user = Depends(get_current_user)):
    return {"data": "..."}

# 2. En backend/main.py
from app.routers import mi_app
app.include_router(mi_app.router, prefix="/api/v1")
```

### Consumir el backend desde el frontend

```jsx
import client from '../../api/client'

// GET
const data = (await client.get('/mi-endpoint')).data

// POST
const result = (await client.post('/mi-endpoint', { campo: valor })).data
// El token JWT se adjunta automaticamente
```
