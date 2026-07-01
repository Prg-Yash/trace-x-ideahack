@echo off
echo ========================================
echo Building Trace-X Desktop Application
echo ========================================
echo.

echo Checking prerequisites...
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

where cargo >nul 2>nul
if errorlevel 1 (
    echo ERROR: Rust is not installed or not in PATH
    echo Please install Rust from: https://rustup.rs/
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo Building desktop application...
call npm run tauri:build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Installer location:
echo %CD%\src-tauri\target\release\bundle\
echo.

pause
