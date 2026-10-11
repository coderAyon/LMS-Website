@echo off
title GBLMS - Library Management System
color 0B
cd /d "%~dp0"

echo.
echo  ======================================================================
echo               GBLMS - LIBRARY MANAGEMENT SYSTEM PORTAL
echo  ======================================================================
echo.
echo   [*] Project Path : %CD%
echo   [*] Starting Frontend and Backend Server...
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo   [+] Node.js runtime detected.
    echo   [+] Launching local web server and auto-opening default browser...
    echo.
    node server.js
) else (
    :: Fallback to Python if Node.js is not in PATH
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo   [!] Node.js not found in PATH. Falling back to Python HTTP Server...
        echo   [+] Starting server at http://localhost:5500 ...
        start "" http://localhost:5500
        python -m http.server 5500
    ) else (
        :: Direct file open fallback
        echo   [!] Neither Node.js nor Python detected in PATH.
        echo   [*] Opening index.html directly in default browser...
        start "" index.html
    )
)

echo.
echo  ======================================================================
echo   [!] GBLMS Server has stopped.
echo  ======================================================================
pause
