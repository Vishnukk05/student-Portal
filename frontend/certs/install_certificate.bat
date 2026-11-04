@echo off
setlocal
echo ========================================================
echo   EduPortal Academic Systems - SSL Certificate Installer
echo ========================================================
echo.

set CERT_FILE=%~dp0eduportal_ssl.crt

if not exist "%CERT_FILE%" (
    echo [ERROR] Certificate file not found: %CERT_FILE%
    pause
    exit /b 1
)

echo [1/2] Installing certificate into Current User Trusted Root store...
certutil -user -addstore -f "Root" "%CERT_FILE%" >nul 2>&1

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Added to Current User Trusted Root Authorities!
) else (
    echo [INFO] Attempting Local Machine store installation...
    certutil -addstore -f "Root" "%CERT_FILE%" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [SUCCESS] Added to Local Machine Trusted Root Authorities!
    )
)

echo.
echo ========================================================
echo   SSL Installation Complete!
echo.
echo   Next Step:
echo   1. Restart your Vite server (Ctrl+C then npm run dev)
echo   2. Open https://localhost:5173 in Chrome or Edge
echo ========================================================
echo.
pause
