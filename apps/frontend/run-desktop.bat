@echo off
echo ========================================
echo Starting Trace-X Desktop Application
echo ========================================
echo.

echo Checking prerequisites...
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo IMPORTANT: Make sure your backend API is running!
echo Backend should be accessible at: http://127.0.0.1:8000
echo.
timeout /t 3

echo.
echo Adding Cargo to PATH...
set PATH=%PATH%;%USERPROFILE%\.cargo\bin

echo Checking Cargo...
where cargo >nul 2>nul
if errorlevel 1 (
    echo ERROR: Rust is not installed or not in PATH
    echo Please install Rust from: https://rustup.rs/
    echo Or restart your terminal after installation
    pause
    exit /b 1
)

echo.
echo Installing dependencies (if needed)...
call npm install
if errorlevel 1 (
    echo WARNING: Failed to install dependencies
)

echo.
echo Starting desktop application in development mode...
call npm run tauri:dev

pause
