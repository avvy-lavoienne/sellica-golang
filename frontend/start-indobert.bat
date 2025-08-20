@echo off
echo 🇮🇩 SELLY IndoBERT Transformers Setup
echo =====================================

echo.
echo 📋 This script will set up IndoBERT Transformers for SELLY
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python detected

REM Check if python-ai-service directory exists
if not exist "python-ai-service" (
    echo ❌ python-ai-service directory not found
    echo Please make sure you're running this from the project root
    pause
    exit /b 1
)

echo ✅ Python service directory found

REM Navigate to python service directory
cd python-ai-service

REM Check if setup has been run
if not exist "venv" (
    echo.
    echo 🔧 First time setup - this may take a few minutes...
    echo.
    python setup.py
    if errorlevel 1 (
        echo ❌ Setup failed
        pause
        exit /b 1
    )
) else (
    echo ✅ Virtual environment already exists
)

echo.
echo 🚀 Starting IndoBERT Service...
echo.
echo 💡 The service will be available at: http://localhost:8000
echo 💡 Press Ctrl+C to stop the service
echo.

REM Start the service
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python main.py
) else (
    echo ❌ Virtual environment activation failed
    pause
    exit /b 1
)

pause
