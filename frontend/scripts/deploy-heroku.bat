@echo off
echo 🚀 SELLY Heroku Deployment Script
echo ==================================

echo.
echo This script will deploy both:
echo 1. Next.js App (SELLY Frontend)
echo 2. Python AI Service (IndoBERT Backend)
echo.

REM Check if Heroku CLI is installed
heroku --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Heroku CLI is not installed
    echo Please install from: https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)

echo ✅ Heroku CLI detected

REM Check if user is logged in
heroku auth:whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Please login to Heroku first:
    heroku login
    if errorlevel 1 (
        echo ❌ Heroku login failed
        pause
        exit /b 1
    )
)

echo ✅ Heroku authentication verified

echo.
echo 📝 Please provide app names (or press Enter for defaults):
echo.

set /p FRONTEND_APP="Frontend app name (default: selly-frontend): "
if "%FRONTEND_APP%"=="" set FRONTEND_APP=selly-frontend

set /p BACKEND_APP="Backend app name (default: selly-indobert): "
if "%BACKEND_APP%"=="" set BACKEND_APP=selly-indobert

echo.
echo 🎯 Deployment Plan:
echo   Frontend: %FRONTEND_APP%.herokuapp.com
echo   Backend:  %BACKEND_APP%.herokuapp.com
echo.

set /p CONFIRM="Continue with deployment? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Deployment cancelled
    pause
    exit /b 0
)

echo.
echo 🔧 Step 1: Creating Heroku Apps...
echo.

REM Create frontend app
echo Creating frontend app: %FRONTEND_APP%
heroku create %FRONTEND_APP% --region us
if errorlevel 1 (
    echo ⚠️ Frontend app might already exist, continuing...
)

REM Create backend app
echo Creating backend app: %BACKEND_APP%
heroku create %BACKEND_APP% --region us
if errorlevel 1 (
    echo ⚠️ Backend app might already exist, continuing...
)

echo.
echo 🔧 Step 2: Configuring Backend (IndoBERT Service)...
echo.

REM Deploy backend first
cd python-ai-service

REM Initialize git if needed
if not exist ".git" (
    git init
    git add .
    git commit -m "Initial IndoBERT service commit"
)

REM Add Heroku remote
git remote remove heroku 2>nul
heroku git:remote -a %BACKEND_APP%

REM Set environment variables for backend
echo Setting backend environment variables...
heroku config:set PYTHONPATH=/app -a %BACKEND_APP%
heroku config:set WEB_CONCURRENCY=1 -a %BACKEND_APP%

REM Deploy backend
echo Deploying IndoBERT service...
git push heroku main
if errorlevel 1 (
    echo ❌ Backend deployment failed
    cd ..
    pause
    exit /b 1
)

echo ✅ Backend deployed successfully

cd ..

echo.
echo 🔧 Step 3: Configuring Frontend (Next.js App)...
echo.

REM Set environment variables for frontend
echo Setting frontend environment variables...
heroku config:set NEXT_PUBLIC_ENABLE_INDOBERT_SERVICE=true -a %FRONTEND_APP%
heroku config:set INDOBERT_SERVICE_URL=https://%BACKEND_APP%.herokuapp.com -a %FRONTEND_APP%
heroku config:set NEXT_PUBLIC_ENABLE_HUGGINGFACE=true -a %FRONTEND_APP%
heroku config:set HUGGINGFACE_API_KEY=%HUGGINGFACE_API_KEY% -a %FRONTEND_APP%
heroku config:set DEEPSEEK_API_KEY=%DEEPSEEK_API_KEY% -a %FRONTEND_APP%

REM Copy environment variables from .env.local if they exist
if exist ".env.local" (
    echo Copying environment variables from .env.local...
    for /f "tokens=1,2 delims==" %%a in (.env.local) do (
        if not "%%a"=="" if not "%%b"=="" (
            heroku config:set %%a=%%b -a %FRONTEND_APP%
        )
    )
)

REM Initialize git if needed
if not exist ".git" (
    git init
    git add .
    git commit -m "Initial SELLY frontend commit"
)

REM Add Heroku remote
git remote remove heroku-frontend 2>nul
heroku git:remote -a %FRONTEND_APP%
git remote rename heroku heroku-frontend

REM Deploy frontend
echo Deploying Next.js app...
git push heroku-frontend main
if errorlevel 1 (
    echo ❌ Frontend deployment failed
    pause
    exit /b 1
)

echo ✅ Frontend deployed successfully

echo.
echo 🎉 Deployment Complete!
echo.
echo 📋 Your Apps:
echo   🌐 Frontend: https://%FRONTEND_APP%.herokuapp.com
echo   🤖 Backend:  https://%BACKEND_APP%.herokuapp.com
echo.
echo 🔍 Next Steps:
echo   1. Test backend: https://%BACKEND_APP%.herokuapp.com/
echo   2. Test frontend: https://%FRONTEND_APP%.herokuapp.com/test-hf
echo   3. Monitor logs: heroku logs --tail -a %FRONTEND_APP%
echo.

pause
