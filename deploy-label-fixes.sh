#!/bin/bash

# Script de déploiement des corrections Label Admin Pages
# Date: 1er Décembre 2025

echo "🚀 DÉPLOIEMENT CORRECTIONS LABEL ADMIN PAGES"
echo "=============================================="
echo ""

# Configuration
SERVER="root@145.223.33.208"
BACKEND_PATH="/var/www/vhosts/indebel.be/api.indebel.be"
FRONTEND_PATH="/var/www/vhosts/indebel.be/pro.indebel.be"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 ÉTAPE 1/3: Déploiement Backend${NC}"
echo "-------------------------------------------"
echo "Transfert de labelController.js..."
scp backend/controllers/labelController.js $SERVER:$BACKEND_PATH/controllers/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend transféré avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du transfert backend${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 ÉTAPE 2/3: Redémarrage PM2${NC}"
echo "-------------------------------------------"
echo "Redémarrage de l'API..."
ssh $SERVER "cd $BACKEND_PATH && pm2 restart indebel-api"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API redémarrée avec succès${NC}"
    
    # Afficher les logs
    echo ""
    echo "📋 Derniers logs PM2:"
    ssh $SERVER "pm2 logs indebel-api --lines 10 --nostream"
else
    echo -e "${RED}❌ Erreur lors du redémarrage PM2${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📱 ÉTAPE 3/3: Déploiement Frontend${NC}"
echo "-------------------------------------------"
echo "Transfert des fichiers dist/..."
scp -r frontend/dist/* $SERVER:$FRONTEND_PATH/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend déployé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du transfert frontend${NC}"
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !${NC}"
echo "=============================================="
echo ""
echo "📊 Résumé des corrections:"
echo "  ✅ Parsing du champ justification"
echo "  ✅ Correction colonnes SQL (statut, processed_at, etc.)"
echo "  ✅ Affichage complet des données demandes exceptionnelles"
echo "  ✅ Boutons Approuver/Rejeter fonctionnels"
echo "  ✅ Icône label.png affichée correctement"
echo ""
echo "🌐 URLs:"
echo "  Frontend: https://pro.indebel.be"
echo "  API:      https://api.indebel.be"
echo ""
echo "🧪 Tests à effectuer:"
echo "  1. /admin/label/exceptional-requests - Voir détails demandes"
echo "  2. Tester approbation/rejet d'une demande"
echo "  3. /admin/label/eligible-users - Vérifier icône label"
echo "  4. Accorder un label et vérifier l'affichage"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de tester manuellement !${NC}"
