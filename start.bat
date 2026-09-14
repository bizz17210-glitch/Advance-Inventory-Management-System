@echo off
REM ===========================================================
REM start.bat
REM Backend (server\index.js) aur Frontend (app\client\build_delivery)
REM dono ko alag windows mein start karta hai.
REM ===========================================================

set PROJECT_ROOT=%~dp0
set SERVER_PATH=%PROJECT_ROOT%server
set FRONTEND_PATH=%PROJECT_ROOT%app\client\build_delivery
set FRONTEND_PORT=3000

if not exist "%SERVER_PATH%" (
    echo Server folder not found: %SERVER_PATH%
    pause
    exit /b 1
)

if not exist "%FRONTEND_PATH%" (
    echo Frontend build not found: %FRONTEND_PATH%
    echo Pehle Build-And-Obfuscate.ps1 chalao taake build_delivery bane.
    pause
    exit /b 1
)

REM ---- Ensure backend dependencies are installed ----
if not exist "%SERVER_PATH%\node_modules" (
    echo Backend node_modules missing - installing...
    pushd "%SERVER_PATH%"
    call npm install
    popd
)

REM ---- Ensure 'serve' package is available globally ----
call npm ls -g serve >nul 2>&1
if errorlevel 1 (
    echo Installing 'serve' globally, one-time setup...
    call npm install -g serve
)

echo === Starting Backend ===
start "Backend" cmd /k "cd /d "%SERVER_PATH%" && node index.js"

timeout /t 2 /nobreak >nul

echo === Starting Frontend (build_delivery) on port %FRONTEND_PORT% ===
start "Frontend" cmd /k "cd /d "%PROJECT_ROOT%" && serve -s "%FRONTEND_PATH%" -l %FRONTEND_PORT%"

echo.
echo Done. Two windows opened:
echo   1^) Backend  (server\index.js^)
echo   2^) Frontend (build_delivery on http://localhost:%FRONTEND_PORT%^)
echo.
echo Browser mein open karo: http://localhost:%FRONTEND_PORT%
echo.
pause