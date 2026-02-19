#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════════════════"
echo "         🚀 TheoProtect - Démarrage"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Fichier .env manquant !${NC}"
    echo ""
    echo -e "${YELLOW}💡 Copiez .env.example vers .env et configurez-le :${NC}"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dépendances manquantes, installation...${NC}"
    echo ""
    npm install
    echo ""
fi

echo -e "${GREEN}🚀 Lancement de TheoProtect...${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

npm start

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Le bot s'est arrêté avec une erreur${NC}"
fi