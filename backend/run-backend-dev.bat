@echo off
REM run-backend-dev.bat — Backend de DESARROLLO en puerto 8001
REM Apunta a miproyecto_dev (BD separada de produccion)
REM Usado por el servicio NSSM del entorno dev
REM CAMBIAR las rutas segun donde este instalado el proyecto y Python

cd /d C:\Users\TU_USUARIO\miproyecto\backend

REM Ajusta esta ruta al Python que uses
set PYTHONPATH=C:\Users\TU_USUARIO\miproyecto\backend
set PATH=C:\Python314;C:\Python314\Scripts;%PATH%

REM BD de desarrollo (separada de produccion) — ajusta las credenciales
set DATABASE_URL=postgresql://usuario:PASSWORD@localhost:5432/miproyecto_dev

REM Modo debug activado en dev
set DEBUG=true

REM Puerto 8001 (prod usa 8000)
C:\Python314\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001
