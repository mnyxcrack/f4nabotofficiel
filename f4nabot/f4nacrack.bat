@echo off
title F4NA BOT LOADER
chcp 65001 >nul
mode con: cols=110 lines=35

:: ANSI COLORS (Windows 10+ support ANSI sequences :contentReference[oaicite:0]{index=0})
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

cls
call :logo
call :loading

echo.
echo ==============================================================
echo              BOT DISCORD EN COURS DE LANCEMENT
echo ==============================================================

echo.

:: =========================
:: LOGS PROPRES ALIGNÉS
:: =========================

call :log "%ESC%[96m[INFO]%ESC%[0m   Verification environnement..."
node -v >nul 2>&1
if errorlevel 1 (
    call :log "%ESC%[91m[ERROR]%ESC%[0m  Node.js non installe !"
    pause
    exit
) else (
    call :log "%ESC%[92m[OK]%ESC%[0m     Node.js detecte"
)

call :log "%ESC%[96m[INFO]%ESC%[0m   Verification dependances..."

if not exist node_modules (
    call :log "%ESC%[96m[INFO]%ESC%[0m   Installation modules..."
    npm install
    call :log "%ESC%[92m[OK]%ESC%[0m     Modules installes"
) else (
    call :log "%ESC%[92m[OK]%ESC%[0m     Modules deja installes"
)

call :log "%ESC%[96m[INFO]%ESC%[0m   Lancement du bot..."
echo.

node src/index.js

echo.
echo ==============================================================
echo BOT ARRETE
echo ==============================================================
pause
exit

:: =========================
:: ANIMATION TEXTE SMOOTH
:: =========================
:log
set text=%~1
setlocal enabledelayedexpansion

for /l %%i in (0,1,150) do (
    set "char=!text:~%%i,1!"
    if "!char!"=="" goto end
    <nul set /p=!char!
    ping localhost -n 1 >nul
)

:end
echo.
exit /b

:: =========================
:: LOADING PROPRE
:: =========================
:loading
setlocal enabledelayedexpansion
set "bar="

for /l %%i in (1,1,12) do (
    set "bar=!bar!█"
    cls
    call :logo
    echo.
    echo        INITIALISATION...
    echo.
    echo        !bar!
    ping localhost -n 1 >nul
)
exit /b

:: =========================
:: TON LOGO F4NA
:: =========================
:logo
cls
echo.
echo  ███████╗    ██╗  ██╗    ███╗   ██╗    █████╗ 
echo  ██╔════╝    ██║  ██║    ████╗  ██║   ██╔══██╗
echo  █████╗      ███████║    ██╔██╗ ██║   ███████║
echo  ██╔══╝           ██║    ██║╚██╗██║   ██╔══██║
echo  ██║              ██║    ██║ ╚████║   ██║  ██║
echo  ╚═╝              ╚═╝    ╚═╝  ╚═══╝   ╚═╝  ╚═╝
echo.
exit /b