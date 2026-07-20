# ============================================================
# Sellica Auto-Start — Run Backend + Frontend on Windows Startup
# Usage: Right-click → Run with PowerShell (admin) or via Task Scheduler
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

# Config
$RootDir = "D:\Journey Code\Github\sellica-golang"
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendExe = Join-Path $BackendDir "server.exe"
$LogFile = Join-Path $RootDir "logs\startup.log"

# Create logs dir
$LogDir = Join-Path $RootDir "logs"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value $line
}

# ── Kill old processes ──────────────────────────────────
Log "🧹 Cleaning old processes..."

# Kill PM2 if any
try { pnpm pm2 delete all 2>$null } catch {}

# Kill processes on ports 3000 and 8081
foreach ($port in @(3000, 8081)) {
    $pids = netstat -ano | Select-String ":$port\s.*LISTEN" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
    foreach ($pid in $pids) {
        try { taskkill /F /PID $pid 2>$null } catch {}
    }
}
Start-Sleep -Seconds 2
Log "✅ Old processes killed"

# ── Start Backend ────────────────────────────────────────
Log "🔥 Starting Backend on :8081..."
$env:PORT = "8081"
$backendProc = Start-Process -FilePath $BackendExe `
    -WorkingDirectory $BackendDir `
    -PassThru -WindowStyle Minimized

if ($backendProc -and !$backendProc.HasExited) {
    Log "✅ Backend started (PID: $($backendProc.Id))"
} else {
    Log "❌ Backend failed to start!"
}

# Wait for backend to be ready
Start-Sleep -Seconds 3

# ── Start Frontend ───────────────────────────────────────
Log "⚡ Starting Frontend on :3000..."
Push-Location $FrontendDir

# Clear stale .next cache
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" 2>$null }

$frontendProc = Start-Process -FilePath "pnpm" `
    -ArgumentList "dev" `
    -WorkingDirectory $FrontendDir `
    -PassThru -WindowStyle Minimized

Pop-Location

if ($frontendProc -and !$frontendProc.HasExited) {
    Log "✅ Frontend started (PID: $($frontendProc.Id))"
} else {
    Log "❌ Frontend failed to start!"
}

# ── Verify ──────────────────────────────────────────────
Start-Sleep -Seconds 5

$backendOk = netstat -ano | Select-String ":8081\s.*LISTEN"
$frontendOk = netstat -ano | Select-String ":3000\s.*LISTEN"

Log "═══════════════════════════════════════"
if ($backendOk) { Log "✅ Backend:  http://localhost:8081" } else { Log "❌ Backend:  NOT RUNNING" }
if ($frontendOk) { Log "✅ Frontend: http://localhost:3000" } else { Log "❌ Frontend: NOT RUNNING" }
Log "═══════════════════════════════════════"

# ── Keep running ────────────────────────────────────────
Log "🚀 Sellica is running. Press Ctrl+C to stop."
try {
    while ($true) {
        if ($backendProc.HasExited -and $frontendProc.HasExited) { break }
        Start-Sleep -Seconds 10
    }
} finally {
    Log "🛑 Stopping Sellica..."
    if (!$backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
    if (!$frontendProc.HasExited) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
    Log "✅ Sellica stopped."
}
