@echo off
echo ========================================
echo Trace-X Desktop Setup Verification
echo ========================================
echo.

set ERRORS=0

echo [1/10] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo    [FAIL] Node.js not found
    set /a ERRORS+=1
) else (
    echo    [OK] Node.js found
    node --version
)

echo.
echo [2/10] Checking Rust...
where cargo >nul 2>nul
if errorlevel 1 (
    echo    [FAIL] Rust/Cargo not found
    echo    Please add to PATH: %%USERPROFILE%%\.cargo\bin
    set /a ERRORS+=1
) else (
    echo    [OK] Rust/Cargo found
    cargo --version
)

echo.
echo [3/10] Checking package.json...
if exist package.json (
    echo    [OK] package.json exists
    findstr /C:"tauri:dev" package.json >nul
    if errorlevel 1 (
        echo    [FAIL] Tauri scripts not found in package.json
        set /a ERRORS+=1
    ) else (
        echo    [OK] Tauri scripts configured
    )
) else (
    echo    [FAIL] package.json not found
    set /a ERRORS+=1
)

echo.
echo [4/10] Checking node_modules...
if exist node_modules (
    echo    [OK] node_modules exists
    if exist node_modules\@tauri-apps (
        echo    [OK] Tauri packages installed
    ) else (
        echo    [WARN] Tauri packages may not be installed
        echo    Run: npm install
    )
) else (
    echo    [FAIL] node_modules not found
    echo    Run: npm install
    set /a ERRORS+=1
)

echo.
echo [5/10] Checking src-tauri directory...
if exist src-tauri (
    echo    [OK] src-tauri directory exists
) else (
    echo    [FAIL] src-tauri directory not found
    set /a ERRORS+=1
)

echo.
echo [6/10] Checking Cargo.toml...
if exist src-tauri\Cargo.toml (
    echo    [OK] Cargo.toml exists
    findstr /C:"tauri-plugin-store" src-tauri\Cargo.toml >nul
    if errorlevel 1 (
        echo    [WARN] Some plugins may be missing
    ) else (
        echo    [OK] Tauri plugins configured
    )
) else (
    echo    [FAIL] Cargo.toml not found
    set /a ERRORS+=1
)

echo.
echo [7/10] Checking tauri.conf.json...
if exist src-tauri\tauri.conf.json (
    echo    [OK] tauri.conf.json exists
    findstr /C:"Trace-X" src-tauri\tauri.conf.json >nul
    if errorlevel 1 (
        echo    [WARN] Configuration may need review
    ) else (
        echo    [OK] Configuration looks good
    )
) else (
    echo    [FAIL] tauri.conf.json not found
    set /a ERRORS+=1
)

echo.
echo [8/10] Checking Rust source files...
if exist src-tauri\src\main.rs (
    echo    [OK] main.rs exists
) else (
    echo    [FAIL] main.rs not found
    set /a ERRORS+=1
)
if exist src-tauri\src\lib.rs (
    echo    [OK] lib.rs exists
) else (
    echo    [FAIL] lib.rs not found
    set /a ERRORS+=1
)

echo.
echo [9/10] Checking desktop utilities...
if exist src\lib\tauri.ts (
    echo    [OK] tauri.ts exists
) else (
    echo    [WARN] Desktop utilities missing
)
if exist src\lib\desktop-init.ts (
    echo    [OK] desktop-init.ts exists
) else (
    echo    [WARN] Desktop initialization missing
)

echo.
echo [10/10] Checking documentation...
if exist DESKTOP_SETUP_GUIDE.md (
    echo    [OK] Setup guide exists
) else (
    echo    [WARN] Setup guide missing
)
if exist TAURI_README.md (
    echo    [OK] Tauri README exists
) else (
    echo    [WARN] Tauri README missing
)

echo.
echo ========================================
echo Verification Complete
echo ========================================

if %ERRORS%==0 (
    echo.
    echo [SUCCESS] All critical checks passed!
    echo.
    echo You are ready to run:
    echo   npm run tauri:dev      - Development mode
    echo   npm run tauri:build    - Production build
    echo.
    echo Or use the batch scripts:
    echo   run-desktop.bat        - Development mode
    echo   build-desktop.bat      - Production build
    echo.
) else (
    echo.
    echo [WARNING] %ERRORS% error(s) found
    echo Please review the output above and fix any issues.
    echo.
    echo Common fixes:
    echo   - Run: npm install
    echo   - Add Rust to PATH: %%USERPROFILE%%\.cargo\bin
    echo   - Ensure you're in the frontend directory
    echo.
)

pause
