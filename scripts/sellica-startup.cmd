@echo off
REM ============================================================
REM Sellica Auto-Start — Task Scheduler Entry Point
REM Runs sellica-startup.ps1 via PowerShell
REM ============================================================

powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "D:\Journey Code\Github\sellica-golang\scripts\sellica-startup.ps1"
