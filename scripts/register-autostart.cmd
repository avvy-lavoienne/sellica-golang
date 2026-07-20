@echo off
REM ============================================================
REM Sellica Auto-Start — Register to Windows Task Scheduler
REM Run as Administrator (right-click → Run as administrator)
REM ============================================================

echo.
echo ========================================
echo   Registering Sellica to Task Scheduler
echo ========================================
echo.

REM Delete old task if exists
schtasks /Delete /TN "SellicaAutoStart" /F 2>nul

REM Create new task: runs at user logon
schtasks /Create ^
    /TN "SellicaAutoStart" ^
    /TR "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"D:\Journey Code\Github\sellica-golang\scripts\sellica-quick-start.ps1\"" ^
    /SC ONLOGON ^
    /RL HIGHEST ^
    /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] SellicaAutoStart task created successfully!
    echo      Will run at every Windows login.
    echo.
    echo To test now: schtasks /Run /TN "SellicaAutoStart"
    echo To remove:   schtasks /Delete /TN "SellicaAutoStart" /F
) else (
    echo.
    echo [FAILED] Could not create task. Run as Administrator!
)

echo.
pause
