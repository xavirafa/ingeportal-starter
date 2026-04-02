# install-services.ps1 — Instala backend y frontend como servicios de Windows con NSSM
# EJECUTAR COMO ADMINISTRADOR: Set-ExecutionPolicy Bypass -Scope Process; .\install-services.ps1
#
# CONFIGURAR antes de usar:
#   $projectDir  — ruta absoluta al directorio raiz del proyecto
#   Los nombres de servicio (MiProyectoBackend, MiProyectoFrontend)
#   El DisplayName y Description de cada servicio

Write-Host "=== Instalando servicios ===" -ForegroundColor Cyan

# ── CONFIGURACION — EDITAR ESTOS VALORES ─────────────────────────────────────
$nssm       = "C:\ProgramData\chocolatey\bin\nssm.exe"  # ruta a nssm.exe
$projectDir = "C:\ruta\a\tu\proyecto"                    # <-- editar
$svcBackend = "MiProyectoBackend"                        # <-- editar nombre servicio
$svcFrontend = "MiProyectoFrontend"                      # <-- editar nombre servicio (opcional)
# ─────────────────────────────────────────────────────────────────────────────

$cmd = "C:\Windows\System32\cmd.exe"

# --- Detener procesos en puertos 8000 y 5173 ---
Write-Host "`n>> Liberando puertos..." -ForegroundColor Yellow
foreach ($puerto in @(8000, 5173)) {
    $connections = Get-NetTCPConnection -LocalPort $puerto -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Write-Host "   Puerto $puerto liberado"
    }
}

# --- Servicio Backend ---
Write-Host "`n>> Instalando $svcBackend..." -ForegroundColor Yellow

& $nssm stop $svcBackend 2>$null
& $nssm remove $svcBackend confirm 2>$null

& $nssm install $svcBackend $cmd "/c $projectDir\backend\run-backend.bat"
& $nssm set $svcBackend AppDirectory "$projectDir\backend"
& $nssm set $svcBackend DisplayName "Mi Proyecto Backend (FastAPI)"
& $nssm set $svcBackend Description "API FastAPI de Mi Proyecto"
& $nssm set $svcBackend Start SERVICE_AUTO_START
& $nssm set $svcBackend AppStdout "$projectDir\backend\logs\service.log"
& $nssm set $svcBackend AppStderr "$projectDir\backend\logs\service.log"
& $nssm set $svcBackend AppStdoutCreationDisposition 4
& $nssm set $svcBackend AppStderrCreationDisposition 4
& $nssm set $svcBackend AppRotateFiles 1
& $nssm set $svcBackend AppRotateBytes 5242880

# --- Servicio Frontend (Vite dev server) ---
Write-Host "`n>> Instalando $svcFrontend..." -ForegroundColor Yellow

& $nssm stop $svcFrontend 2>$null
& $nssm remove $svcFrontend confirm 2>$null

& $nssm install $svcFrontend $cmd "/c $projectDir\frontend\node_modules\.bin\vite.cmd --host"
& $nssm set $svcFrontend AppDirectory "$projectDir\frontend"
& $nssm set $svcFrontend DisplayName "Mi Proyecto Frontend (Vite/React)"
& $nssm set $svcFrontend Description "Frontend React de Mi Proyecto"
& $nssm set $svcFrontend Start SERVICE_AUTO_START
& $nssm set $svcFrontend AppStdout "$projectDir\frontend\logs\service.log"
& $nssm set $svcFrontend AppStderr "$projectDir\frontend\logs\service.log"
& $nssm set $svcFrontend AppStdoutCreationDisposition 4
& $nssm set $svcFrontend AppStderrCreationDisposition 4
& $nssm set $svcFrontend AppRotateFiles 1
& $nssm set $svcFrontend AppRotateBytes 5242880

# --- Crear carpetas de logs ---
New-Item -ItemType Directory -Force -Path "$projectDir\backend\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "$projectDir\frontend\logs" | Out-Null

# --- Iniciar servicios ---
Write-Host "`n>> Iniciando servicios..." -ForegroundColor Yellow
& $nssm start $svcBackend
& $nssm start $svcFrontend

# --- Verificar ---
Start-Sleep -Seconds 5
Write-Host "`n=== Estado de los servicios ===" -ForegroundColor Cyan
$backendStatus  = & $nssm status $svcBackend
$frontendStatus = & $nssm status $svcFrontend
Write-Host "Backend:  $backendStatus"
Write-Host "Frontend: $frontendStatus"

if ($backendStatus -eq "SERVICE_RUNNING" -and $frontendStatus -eq "SERVICE_RUNNING") {
    Write-Host "`n=== EXITO! Ambos servicios corriendo ===" -ForegroundColor Green
} else {
    Write-Host "`n=== ATENCION: Revisa los logs si algun servicio no esta RUNNING ===" -ForegroundColor Red
    Write-Host "Backend log:  $projectDir\backend\logs\service.log"
    Write-Host "Frontend log: $projectDir\frontend\logs\service.log"
}

Write-Host "`nBackend:  http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
