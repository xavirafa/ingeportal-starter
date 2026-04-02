@echo off
REM run-backend.bat — Script que ejecuta uvicorn con el entorno correcto
REM Usado por el servicio NSSM de Windows (produccion, puerto 8000)
REM CAMBIAR las rutas segun donde este instalado el proyecto y Python

cd /d C:\Users\TU_USUARIO\miproyecto\backend

REM Ajusta esta ruta al Python que uses
set PYTHONPATH=C:\Users\TU_USUARIO\miproyecto\backend
set PATH=C:\Python314;C:\Python314\Scripts;%PATH%

C:\Python314\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
