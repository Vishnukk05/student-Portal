@echo off
setlocal
echo ========================================================
echo   EduPortal Academic Systems - SSL Certificate Installer
echo ========================================================
echo.

set CERT_FILE=%~dp0Normal standard student portal\frontend\certs\eduportal_ssl.crt
if not exist "%CERT_FILE%" set CERT_FILE=%~dp0frontend\certs\eduportal_ssl.crt

if not exist "%CERT_FILE%" (
    echo [ERROR] Certificate file not found: %CERT_FILE%
    pause
    exit /b 1
)

echo [1/2] Installing certificate into Current User Trusted Root store...
certutil -user -addstore -f "Root" "%CERT_FILE%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Added to Current User Trusted Root Authorities!
) else (
    echo.
    echo [INFO] Attempting Local Machine store installation...
    certutil -addstore -f "Root" "%CERT_FILE%"
    if %ERRORLEVEL% equ 0 (
        echo [SUCCESS] Added to Local Machine Trusted Root Authorities!
    ) else (
        echo [NOTE] If prompted, click 'Yes' to trust the certificate, or run this script as Administrator.
    )
)

echo.
echo ========================================================
echo   SSL Installation Complete!
echo.
echo   Next Step:
echo   1. Restart your Vite dev server (Ctrl+C then npm run dev)
echo   2. Refresh https://localhost:5173
echo ========================================================
echo.
pause

