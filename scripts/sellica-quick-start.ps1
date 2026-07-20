# ============================================================
# Sellica Quick Start — Run Backend + Frontend (no build)
# Usage: powershell -ExecutionPolicy Bypass -File sellica-quick-start.ps1
# ============================================================

$RootDir = "D:\Journey Code\Github\sellica-golang"
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendExe = Join-Path $BackendDir "server.exe"

Write-Host ""
Write-Host "  Sellica Quick Start" -ForegroundColor Cyan
Write-Host "  Backend :8081 | Frontend :3000" -ForegroundColor Gray
Write-Host ""

# Cleanup
foreach ($port in @(3000, 8081)) {
    netstat -ano | Select-String ":$port\s.*LISTEN" | ForEach-Object {
        $pid = ($_ -split '\s+')[-1]
        if ($pid -match '^\d+$') { try { taskkill /F /PID $pid 2>$null } catch {} }
    }
}
Start-Sleep -Seconds 1

# Check server.exe
if (!(Test-Path $BackendExe)) {
    Write-Host "  server.exe not found! Run: go build -o server.exe ./cmd/server/main.go" -ForegroundColor Red
    exit 1
}

# Start backend
Write-Host "  Starting backend..." -ForegroundColor Yellow
$backend = Start-Process -FilePath $BackendExe -WorkingDirectory $BackendDir -PassThru -WindowStyle Minimized

# Start frontend
$nextExists = Test-Path (Join-Path $FrontendDir ".next")
if ($nextExists) {
    Write-Host "  Starting frontend (prod mode)..." -ForegroundColor Yellow
    $frontend = Start-Process -FilePath "pnpm" -ArgumentList "start" -WorkingDirectory $FrontendDir -PassThru -WindowStyle Minimized
} else {
    Write-Host "  .next not found - starting frontend (dev mode, first run slower)..." -ForegroundColor Yellow
    $frontend = Start-Process -FilePath "pnpm" -ArgumentList "dev" -WorkingDirectory $FrontendDir -PassThru -WindowStyle Minimized
}

Start-Sleep -Seconds 3

# Status
$bOk = netstat -ano | Select-String ":8081\s.*LISTEN"
$fOk = netstat -ano | Select-String ":3000\s.*LISTEN"

Write-Host ""
if ($bOk) { Write-Host "  Backend:  http://localhost:8081  [OK]" -ForegroundColor Green }
else      { Write-Host "  Backend:  http://localhost:8081  [FAIL]" -ForegroundColor Red }
if ($fOk) { Write-Host "  Frontend: http://localhost:3000  [OK]" -ForegroundColor Green }
else      { Write-Host "  Frontend: http://localhost:3000  [FAIL]" -ForegroundColor Red }
Write-Host ""
Write-Host "  Ctrl+C to stop" -ForegroundColor Gray

# Keep alive
try { while ($true) { if ($backend.HasExited -and $frontend.HasExited) { break }; Start-Sleep -Seconds 5 } }
finally {
    if (!$backend.HasExited) { Stop-Process -Id $backend.Id -Force -EA 0 }
    if (!$frontend.HasExited) { Stop-Process -Id $frontend.Id -Force -EA 0 }
    Write-Host "  Stopped." -ForegroundColor Yellow
}
