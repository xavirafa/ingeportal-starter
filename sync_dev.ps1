# sync_dev.ps1 — Copia la BD de produccion a desarrollo
# Uso: .\sync_dev.ps1
# Cuando usarlo: antes de iniciar una sesion de pruebas para tener datos reales actualizados.
# ADVERTENCIA: borra todos los datos actuales de la BD dev y los reemplaza con los de prod.
#
# CONFIGURAR antes de usar:
#   $PG_USER  — usuario PostgreSQL que tiene acceso a ambas BDs
#   $PG_PASS  — contrasena del usuario
#   $DB_PROD  — nombre de la BD de produccion
#   $DB_DEV   — nombre de la BD de desarrollo
#   $LOG_FILE — ruta del archivo de log

param(
    [switch]$Force  # Omitir confirmacion interactiva
)

# ── CONFIGURACION — EDITAR ESTOS VALORES ─────────────────────────────────────
$PG_BIN     = "C:\Program Files\PostgreSQL\17\bin"
$PG_HOST    = "localhost"
$PG_PORT    = "5432"
$PG_USER    = "TU_USUARIO_PG"      # <-- editar
$PG_PASS    = "TU_PASSWORD_PG"     # <-- editar
$DB_PROD    = "miproyecto"         # <-- editar
$DB_DEV     = "miproyecto_dev"     # <-- editar
$BACKEND_DEV_SERVICE = "MiProyectoBackendDev"  # <-- nombre del servicio NSSM dev
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$LOG_FILE   = "$PROJECT_DIR\backend\logs\sync_dev.log"
# ─────────────────────────────────────────────────────────────────────────────

$DUMP_FILE  = "$env:TEMP\miproyecto_sync_$(Get-Date -f 'yyyyMMdd_HHmm').dump"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  SYNC: $DB_PROD  -->  $DB_DEV" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ADVERTENCIA: Se borraran los datos de '$DB_DEV'" -ForegroundColor Yellow
Write-Host "  y se reemplazaran con los de produccion." -ForegroundColor Yellow
Write-Host ""

if (-not $Force) {
    $resp = Read-Host "  Continuar? (s/n)"
    if ($resp -notin @("s","S","si","Si","SI","y","Y")) {
        Write-Host "  Cancelado." -ForegroundColor Gray
        exit 0
    }
}

$env:PGPASSWORD = $PG_PASS

Write-Host ""
Write-Host "[1/3] Deteniendo backend dev..." -ForegroundColor Gray
Stop-Service $BACKEND_DEV_SERVICE -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[2/3] Volcando produccion y restaurando en dev..." -ForegroundColor Gray

# pg_dump de produccion
& "$PG_BIN\pg_dump.exe" -h $PG_HOST -p $PG_PORT -U $PG_USER -Fc -d $DB_PROD -f $DUMP_FILE
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pg_dump fallo." -ForegroundColor Red
    Start-Service $BACKEND_DEV_SERVICE
    exit 1
}

# Terminar conexiones activas a la BD dev
& "$PG_BIN\psql.exe" -h $PG_HOST -p $PG_PORT -U $PG_USER -d $DB_PROD -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_DEV' AND pid <> pg_backend_pid()" | Out-Null

# pg_restore a dev — sin cambiar ownership (--no-owner) para evitar warnings de permisos
& "$PG_BIN\pg_restore.exe" -h $PG_HOST -p $PG_PORT -U $PG_USER -d $DB_DEV --clean --if-exists --no-owner --no-privileges -Fc $DUMP_FILE
if ($LASTEXITCODE -ne 0) {
    Write-Host "ADVERTENCIA: pg_restore termino con advertencias menores." -ForegroundColor Yellow
}

Remove-Item $DUMP_FILE -ErrorAction SilentlyContinue

Write-Host "[3/3] Reiniciando backend dev..." -ForegroundColor Gray
Start-Service $BACKEND_DEV_SERVICE
Start-Sleep -Seconds 3

$estado = (Get-Service $BACKEND_DEV_SERVICE -ErrorAction SilentlyContinue).Status
Write-Host ""
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
if ($estado -eq "Running") {
    Write-Host "  Sync completado. $DB_DEV tiene datos frescos de produccion." -ForegroundColor Green
    "$timestamp | OK | Sincronizacion completada. $DB_DEV actualizado desde produccion." | Add-Content -Path $LOG_FILE -Encoding UTF8
} else {
    Write-Host "  Sync completado pero el backend dev no arranco. Revisar logs." -ForegroundColor Yellow
    "$timestamp | ERROR | Sync completado pero $BACKEND_DEV_SERVICE no arranco." | Add-Content -Path $LOG_FILE -Encoding UTF8
}
Write-Host ""
