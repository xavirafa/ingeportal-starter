# admin-run.ps1 — Ejecuta un comando como administrador
# Uso: powershell -File admin-run.ps1 "comando a ejecutar"
# Ejemplo: powershell -File admin-run.ps1 "nssm restart MiProyectoBackend"

param([string]$Comando)

if (-not $Comando) {
    Write-Host "Uso: powershell -File admin-run.ps1 'comando'"
    exit 1
}

Start-Process powershell -ArgumentList "-Command", $Comando -Verb RunAs -Wait
