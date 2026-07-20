# ============================================================
# Sellica Production Start — Build + Run Backend + Frontend
# Usage: powershell -ExecutionPolicy Bypass -File sellica-prod-start.ps1
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

# Config
$RootDir = "D:\Journey Code\Github\sellica-golang"
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendExe = Join-Path $BackendDir "server.exe"
$Polyfill = Join-Path $FrontendDir "polyfill-self.cjs"
$LogFile = Join-Path $RootDir "logs\prod-start.log"

# Create logs dir
$LogDir = Join-Path $RootDir "logs"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value $line
}

function Kill-Port($port) {
    $pids = netstat -ano | Select-String ":$port\s.*LISTEN" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
    foreach ($pid in $pids) {
        try { taskkill /F /PID $pid 2>$null } catch {}
    }
}

# ══════ HEADER ══════
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sellica Production Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ══════ CLEANUP ══════
Log "Cleaning old processes..."
Kill-Port 3000
Kill-Port 8081
try { pnpm pm2 delete all 2>$null } catch {}
Start-Sleep -Seconds 2
Log "Old processes killed"

# ══════ BACKEND BUILD ══════
$buildNeeded = $true
if (Test-Path $BackendExe) {
    $age = (Get-Date) - (Get-Item $BackendExe).LastWriteTime
    if ($age.TotalHours -lt 24) {
        $buildNeeded = $false
        Log "Backend binary fresh ($([math]::Round($age.TotalMinutes, 0)) min old) — skip build"
    }
}
if ($buildNeeded) {
    Log "Building backend..."
    Push-Location $BackendDir
    $buildResult = go build -o server.exe ./cmd/server/main.go 2>&1
    Pop-Location
    if (Test-Path $BackendExe) {
        Log "Backend build OK"
    } else {
        Log "Backend build FAILED!"
        Log $buildResult
        exit 1
    }
}

# ══════ FRONTEND BUILD ══════
Log "Building frontend (this may take a few minutes)..."
Push-Location $FrontendDir

# Clear stale cache
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" 2>$null }

# Build with self polyfill for Node.js
$env:NODE_OPTIONS = "--require ./polyfill-self.cjs"
$buildResult = npx cross-env DISABLE_RUNTIME_LOGS=true next build 2>&1
$buildExit = $LASTEXITCODE
Pop-Location

if ($buildExit -eq 0) {
    Log "Frontend build OK"
} else {
    Log "Frontend build FAILED (exit $buildExit)"
    Log "Falling back to dev mode..."
    $useDev = $true
}

# ══════ START BACKEND ══════
Log "Starting backend on :8081..."
$env:PORT = "8081"
$backendProc = Start-Process -FilePath $BackendExe `
    -WorkingDirectory $BackendDir `
    -PassThru -WindowStyle Minimized

if ($backendProc -and !$backendProc.HasExited) {
    Log "Backend started (PID: $($backendProc.Id))"
} else {
    Log "Backend failed to start!"
    exit 1
}

Start-Sleep -Seconds 3

# ══════ START FRONTEND ══════
if ($useDev) {
    Log "Starting frontend in DEV mode on :3000..."
    Push-Location $FrontendDir
    $frontendProc = Start-Process -FilePath "pnpm" `
        -ArgumentList "dev" `
        -WorkingDirectory $FrontendDir `
        -PassThru -WindowStyle Minimized
    Pop-Location
} else {
    Log "Starting frontend in PROD mode on :4000..."
    Push-Location $FrontendDir
    $frontendProc = Start-Process -FilePath "pnpm" `
        -ArgumentList "start" `
        -WorkingDirectory $FrontendDir `
        -PassThru -WindowStyle Minimized
    Pop-Location
}

if ($frontendProc -and !$frontendProc.HasExited) {
    Log "Frontend started (PID: $($frontendProc.Id))"
} else {
    Log "Frontend failed to start!"
}

# ══════ VERIFY ══════
Start-Sleep -Seconds 5

$backendOk = netstat -ano | Select-String ":8081\s.*LISTEN"
$frontendPort = if ($useDev) { 3000 } else { 4000 }
$frontendOk = netstat -ano | Select-String ":$frontendPort\s.*LISTEN"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sellica Production Status" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

if ($backendOk) {
    Write-Host "  Backend:  http://localhost:8081  [RUNNING]" -ForegroundColor Green
    Log "Backend: http://localhost:8081 OK"
} else {
    Write-Host "  Backend:  http://localhost:8081  [FAILED]" -ForegroundColor Red
    Log "Backend: NOT RUNNING"
}

if ($frontendOk) {
    Write-Host "  Frontend: http://localhost:$frontendPort  [RUNNING]" -ForegroundColor Green
    $mode = if ($useDev) { "DEV" } else { "PROD" }
    Write-Host "  Mode:     $mode" -ForegroundColor Yellow
    Log "Frontend: http://localhost:$frontendPort OK ($mode)"
} else {
    Write-Host "  Frontend: http://localhost:$frontendPort  [FAILED]" -ForegroundColor Red
    Log "Frontend: NOT RUNNING"
}

Write-Host ""
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# ══════ KEEP ALIVE ══════
try {
    while ($true) {
        if ($backendProc.HasExited -and $frontendProc.HasExited) { break }
        Start-Sleep -Seconds 10
    }
} finally {
    Log "Stopping Sellica..."
    if (!$backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
    if (!$frontendProc.HasExited) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
    Log "Sellica stopped."
}
