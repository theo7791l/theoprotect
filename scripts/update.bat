@echo off
chcp 65001 >nul
color 0B

echo.
echo ═══════════════════════════════════════════════════════
echo     🔄 TheoProtect Auto-Update (Windows)
echo ═══════════════════════════════════════════════════════
echo.

REM Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git n'est pas installé !
    echo.
    echo 📥 Téléchargez Git depuis : https://git-scm.com/
    echo.
    pause
    exit /b 1
)

REM Check if we're in a Git repository
if not exist ".git" (
    echo ❌ Ce n'est pas un dépôt Git !
    echo.
    echo 💡 Solution : Supprimez ce dossier et clonez à nouveau :
    echo    git clone https://github.com/theo7791l/theoprotect.git
    echo.
    pause
    exit /b 1
)

echo [1/6] 🔍 Vérification des mises à jour...
echo.

REM Fetch latest changes
git fetch origin main >nul 2>&1

REM Check if updates are available
for /f %%i in ('git rev-list HEAD...origin/main --count') do set COMMITS=%%i

if "%COMMITS%"=="0" (
    echo ✅ Vous êtes déjà à jour !
    echo.
    pause
    exit /b 0
)

echo 📦 %COMMITS% nouvelle(s) mise(s) à jour disponible(s)
echo.
echo 📝 Changements :
git log HEAD..origin/main --oneline --no-decorate
echo.

echo [2/6] 💾 Sauvegarde de la configuration...
if exist ".env" (
    copy /Y ".env" ".env.backup" >nul
    echo ✅ .env sauvegardé
) else (
    echo ⚠️  Aucun fichier .env trouvé
)
echo.

echo [3/6] 📥 Téléchargement des mises à jour...
git reset --hard origin/main
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du téléchargement !
    pause
    exit /b 1
)
echo ✅ Code mis à jour
echo.

echo [4/6] 📦 Installation des dépendances...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation !
    pause
    exit /b 1
)
echo ✅ Dépendances installées
echo.

echo [5/6] ⚙️ Déploiement des commandes...
call npm run deploy
if %errorlevel% neq 0 (
    echo ⚠️  Erreur lors du déploiement (continuons quand même)
)
echo ✅ Commandes déployées
echo.

echo [6/6] 🎉 Mise à jour terminée !
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo 💡 Redémarrez le bot avec : npm start
echo 💡 Ou lancez directement : start.bat
echo.
echo ═══════════════════════════════════════════════════════
echo.
pause