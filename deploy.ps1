# deploy.ps1 — Sube cambios de dev a produccion
# Uso: cd miproyecto && .\deploy.ps1
# Uso sin confirmacion: .\deploy.ps1 -Force
#
# CONFIGURAR antes de usar:
#   $ROOT              — ruta absoluta al directorio raiz del proyecto
#   $PYTHON            — ruta al ejecutable Python
#   $BACKEND_SERVICE   — nombre del servicio NSSM del backend prod

param([switch]$Force)

$ErrorActionPreference = "Stop"

# ── CONFIGURACION — EDITAR ESTOS VALORES ─────────────────────────────────────
$ROOT              = "C:\ruta\a\tu\proyecto"   # <-- editar
$PYTHON            = "C:\Python314\python.exe"  # <-- editar si es diferente
$BACKEND_SERVICE   = "MiProyectoBackend"        # <-- nombre del servicio NSSM prod
# ─────────────────────────────────────────────────────────────────────────────

$VERSION_FILE = "$ROOT\frontend\public\version.json"

Write-Host ""
Write-Host "=== DEPLOY: dev -> produccion ===" -ForegroundColor Cyan
Write-Host ""

Set-Location $ROOT

# 0. Calcular nueva version: YYYY.MM.DD.N (N se incrementa si ya hubo deploy hoy)
$today   = Get-Date
$dateStr = $today.ToString("yyyy.MM.dd")
$dateLabel = $today.ToString("yyyy-MM-dd")

$buildNum = 1
if (Test-Path $VERSION_FILE) {
    $existing = Get-Content $VERSION_FILE | ConvertFrom-Json
    if ($existing.date -eq $dateLabel) {
        $buildNum = [int]($existing.build) + 1
    }
}
$newVersion = "$dateStr.$buildNum"
Write-Host "  Version: v$newVersion" -ForegroundColor Cyan

# 1. Verificar cambios sin commitear
$status = git status --porcelain
if ($status) {
    Write-Host "[!] Hay cambios sin commitear:" -ForegroundColor Yellow
    Write-Host $status
    if (-not $Force) {
        $resp = Read-Host "Continuar igual? (s/n)"
        if ($resp -ne "s") { exit 1 }
    } else {
        Write-Host "      -Force activo, continuando." -ForegroundColor Gray
    }
}

# 2. Merge dev -> main
Write-Host "[1/6] Mergeando dev -> main..." -ForegroundColor White

# Detener nginx si esta corriendo
if (Get-Process nginx -ErrorAction SilentlyContinue) {
    Write-Host "      Deteniendo nginx..." -ForegroundColor Gray
    Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Descartar archivos locales que no van al deploy
git checkout -- .claude/settings.local.json 2>&1 | Out-Null

git checkout main
if ($LASTEXITCODE -ne 0) { Write-Host "[!] git checkout main fallo" -ForegroundColor Red; exit 1 }
git merge dev --no-edit
if ($LASTEXITCODE -ne 0) { Write-Host "[!] git merge fallo" -ForegroundColor Red; exit 1 }
git push origin main
git checkout dev
Write-Host "      OK" -ForegroundColor Green

# 3. Aplicar migraciones pendientes a produccion
Write-Host "[2/6] Aplicando migraciones BD..." -ForegroundColor White
$env:PYTHONPATH = "$ROOT\backend"
$migResult = & $PYTHON "$ROOT\backend\apply_migrations.py" 2>&1
Write-Host $migResult
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Error en migraciones. Deploy abortado." -ForegroundColor Red
    exit 1
}
Write-Host "      OK" -ForegroundColor Green

# 4. Actualizar version.json antes del build
Write-Host "[3/6] Actualizando version.json..." -ForegroundColor White
$versionData = @{
    version = $newVersion
    date    = $dateLabel
    env     = "prod"
    build   = $buildNum
} | ConvertTo-Json
$versionData | Set-Content $VERSION_FILE -Encoding UTF8
Write-Host "      v$newVersion" -ForegroundColor Green

# 5. Build del frontend (ya incluye el version.json actualizado)
Write-Host "[4/6] Compilando frontend..." -ForegroundColor White
Set-Location "$ROOT\frontend"
npm run build
Set-Location $ROOT
Write-Host "      OK" -ForegroundColor Green

# 6. Commit del version.json en dev y push
Write-Host "[5/6] Guardando version en git..." -ForegroundColor White
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
git add frontend/public/version.json
git commit -m "chore: deploy v$newVersion a produccion [skip ci]" | Out-Null
git push origin dev | Out-Null
# Actualizar main con el version.json
git checkout main | Out-Null
git merge dev --no-edit | Out-Null
git push origin main | Out-Null
git checkout dev | Out-Null
$ErrorActionPreference = $prev
Write-Host "      OK" -ForegroundColor Green

# 7. Reiniciar Nginx y backend
Write-Host "[6/6] Reiniciando Nginx y backend..." -ForegroundColor White
Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-Process "$ROOT\nginx\nginx.exe" -WorkingDirectory "$ROOT\nginx"
Start-Sleep -Seconds 1

# Reiniciar backend prod
nssm restart $BACKEND_SERVICE
Start-Sleep -Seconds 3
Write-Host "      OK" -ForegroundColor Green

Write-Host ""
Write-Host "=== DEPLOY COMPLETADO ===" -ForegroundColor Green
Write-Host "  Version: v$newVersion" -ForegroundColor Cyan
Write-Host ""
