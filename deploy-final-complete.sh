#!/bin/bash

# Script de déploiement FINAL COMPLET
# Inclut: PWA Analytics + Terminologie + Responsive
# Date: 30 novembre 2025

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SERVER="145.223.33.208"
SSH_USER="root"
BACKEND_DIR="/var/www/vhosts/indebel.be/api.indebel.be"
FRONTEND_DIR="/var/www/vhosts/indebel.be/pro.indebel.be"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║      🚀 DÉPLOIEMENT FINAL COMPLET - INDEBEL 🚀       ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║  PWA Analytics + Terminologie + Responsive + Tout    ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# ÉTAPE 1: MIGRATION BDD PWA
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 1/5: MIGRATION BASE DE DONNÉES PWA${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Transfert migration PWA..."
scp backend/migrations/create_pwa_installations.sql ${SSH_USER}@${SERVER}:/tmp/

echo -e "${YELLOW}▶${NC} Application migration..."
ssh ${SSH_USER}@${SERVER} "mysql -u indebel_user -p'indebel_pass' indebel_bd < /tmp/create_pwa_installations.sql"

echo -e "${GREEN}✅${NC} Migration PWA appliquée"
echo ""

# ============================================
# ÉTAPE 2: DÉPLOIEMENT BACKEND
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 2/5: DÉPLOIEMENT BACKEND${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Transfert controller PWA..."
scp backend/controllers/pwaController.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/controllers/

echo -e "${YELLOW}▶${NC} Transfert routes PWA..."
scp backend/routes/pwaRoutes.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/routes/

echo -e "${YELLOW}▶${NC} Mise à jour server.js..."
scp backend/server.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/

echo -e "${YELLOW}▶${NC} Mise à jour factureService (terminologie)..."
scp backend/services/factureService.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/services/

echo -e "${GREEN}✅${NC} Backend déployé"
echo ""

# ============================================
# ÉTAPE 3: BUILD FRONTEND
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 3/5: BUILD FRONTEND${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Build production..."
cd frontend
npm run build
cd ..

echo -e "${GREEN}✅${NC} Build terminé"
echo ""

# ============================================
# ÉTAPE 4: DÉPLOIEMENT FRONTEND
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 4/5: DÉPLOIEMENT FRONTEND${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Transfert fichiers..."
rsync -avz --delete frontend/dist/ ${SSH_USER}@${SERVER}:${FRONTEND_DIR}/

echo -e "${GREEN}✅${NC} Frontend déployé"
echo ""

# ============================================
# ÉTAPE 5: REDÉMARRAGE PM2
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 5/5: REDÉMARRAGE API${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Redémarrage PM2..."
ssh ${SSH_USER}@${SERVER} "pm2 restart indebel-api"

echo -e "${YELLOW}▶${NC} Vérification status..."
ssh ${SSH_USER}@${SERVER} "pm2 status indebel-api"

echo -e "${GREEN}✅${NC} API redémarrée"
echo ""

# ============================================
# RÉSUMÉ
# ============================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║          ✅ DÉPLOIEMENT FINAL TERMINÉ ! ✅              ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📋 Nouveautés déployées:${NC}"
echo -e "  ✅ Page Admin PWA Analytics (/admin/pwa)"
echo -e "  ✅ Suivi installations PWA"
echo -e "  ✅ Suivi notifications push"
echo -e "  ✅ Terminologie changée (prestataires/recruteurs)"
echo -e "  ✅ Système de facturation"
echo -e "  ✅ Responsive mobile/tablet/desktop"
echo ""

echo -e "${BLUE}🔗 URLs Production:${NC}"
echo -e "  Frontend: https://pro.indebel.be"
echo -e "  API: https://api.indebel.be"
echo -e "  Admin PWA: https://pro.indebel.be/admin/pwa"
echo -e "  Admin Factures: https://pro.indebel.be/admin/factures"
echo ""

echo -e "${GREEN}🎉 Déploiement réussi! L'application est à jour.${NC}"
echo ""
