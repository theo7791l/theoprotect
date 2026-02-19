#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════"
echo "     🔄 TheoProtect Auto-Update (Linux/macOS)"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git n'est pas installé !${NC}"
    echo ""
    echo "📥 Installation :"
    echo "   Ubuntu/Debian: sudo apt install git"
    echo "   macOS: brew install git"
    echo ""
    exit 1
fi

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Ce n'est pas un dépôt Git !${NC}"
    echo ""
    echo -e "${YELLOW}💡 Solution : Supprimez ce dossier et clonez à nouveau :${NC}"
    echo "   git clone https://github.com/theo7791l/theoprotect.git"
    echo ""
    exit 1
fi

echo -e "${BLUE}[1/6] 🔍 Vérification des mises à jour...${NC}"
echo ""

# Fetch latest changes
git fetch origin main &> /dev/null

# Check if updates are available
COMMITS=$(git rev-list HEAD...origin/main --count)

if [ "$COMMITS" -eq "0" ]; then
    echo -e "${GREEN}✅ Vous êtes déjà à jour !${NC}"
    echo ""
    exit 0
fi

echo -e "${GREEN}📦 $COMMITS nouvelle(s) mise(s) à jour disponible(s)${NC}"
echo ""
echo "📝 Changements :"
git log HEAD..origin/main --oneline --no-decorate
echo ""

echo -e "${BLUE}[2/6] 💾 Sauvegarde de la configuration...${NC}"
if [ -f ".env" ]; then
    cp .env .env.backup
    echo -e "${GREEN}✅ .env sauvegardé${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun fichier .env trouvé${NC}"
fi
echo ""

echo -e "${BLUE}[3/6] 📥 Téléchargement des mises à jour...${NC}"
git reset --hard origin/main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du téléchargement !${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code mis à jour${NC}"
echo ""

echo -e "${BLUE}[4/6] 📦 Installation des dépendances...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'installation !${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

echo -e "${BLUE}[5/6] ⚙️ Déploiement des commandes...${NC}"
npm run deploy
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Erreur lors du déploiement (continuons quand même)${NC}"
fi
echo -e "${GREEN}✅ Commandes déployées${NC}"
echo ""

echo -e "${GREEN}[6/6] 🎉 Mise à jour terminée !${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "💡 Redémarrez le bot avec : npm start"
echo "💡 Ou avec PM2 : pm2 restart theoprotect"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
