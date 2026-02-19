@echo off
chcp 65001 >nul
color 0A

echo.
echo ═══════════════════════════════════════════════════════
echo         🚀 TheoProtect - Démarrage
echo ═══════════════════════════════════════════════════════
echo.

REM Check if .env exists
if not exist ".env" (
    echo ❌ Fichier .env manquant !
    echo.
    echo 💡 Copiez .env.example vers .env et configurez-le :
    echo    copy .env.example .env
    echo    notepad .env
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  Dépendances manquantes, installation...
    echo.
    call npm install
    echo.
)

echo 🚀 Lancement de TheoProtect...
echo.
echo ═══════════════════════════════════════════════════════
echo.

call npm start

if %errorlevel% neq 0 (
    echo.
    echo ❌ Le bot s'est arrêté avec une erreur
    pause
)