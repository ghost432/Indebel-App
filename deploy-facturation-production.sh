#!/bin/bash

# Script de déploiement du système de facturation en production
# Date: 30 novembre 2025

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER="145.223.33.208"
SSH_USER="root"
BACKEND_DIR="/var/www/vhosts/indebel.be/api.indebel.be"
FRONTEND_DIR="/var/www/vhosts/indebel.be/pro.indebel.be"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║   🚀 DÉPLOIEMENT SYSTÈME FACTURATION - PRODUCTION 🚀  ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# ÉTAPE 1: MIGRATION BASE DE DONNÉES
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 1/5: MIGRATION BASE DE DONNÉES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Transfert du fichier de migration..."
scp backend/migrations/create_factures_forfaits.sql ${SSH_USER}@${SERVER}:/tmp/

echo -e "${YELLOW}▶${NC} Application de la migration..."
ssh ${SSH_USER}@${SERVER} "mysql -u indebel_user -p'indebel_pass' indebel_bd < /tmp/create_factures_forfaits.sql"

echo -e "${GREEN}✅${NC} Migration appliquée"
echo ""

# ============================================
# ÉTAPE 2: INSTALLATION PDFKIT
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 2/5: INSTALLATION PACKAGE PDFKIT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Installation de pdfkit sur le serveur..."
ssh ${SSH_USER}@${SERVER} "cd ${BACKEND_DIR} && npm install pdfkit"

echo -e "${GREEN}✅${NC} pdfkit installé"
echo ""

# ============================================
# ÉTAPE 3: TRANSFERT FICHIERS BACKEND
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 3/5: TRANSFERT FICHIERS BACKEND${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Création du dossier factures..."
ssh ${SSH_USER}@${SERVER} "mkdir -p ${BACKEND_DIR}/public/factures && chmod 755 ${BACKEND_DIR}/public/factures"

echo -e "${YELLOW}▶${NC} Transfert service facturation..."
scp backend/services/factureService.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/services/

echo -e "${YELLOW}▶${NC} Transfert controller factures..."
scp backend/controllers/factureController.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/controllers/

echo -e "${YELLOW}▶${NC} Transfert routes factures..."
scp backend/routes/factureRoutes.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/routes/

echo -e "${YELLOW}▶${NC} Mise à jour server.js et paiementController.js..."
scp backend/server.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/
scp backend/controllers/paiementController.js ${SSH_USER}@${SERVER}:${BACKEND_DIR}/controllers/

echo -e "${GREEN}✅${NC} Fichiers backend transférés"
echo ""

# ============================================
# ÉTAPE 4: BUILD ET TRANSFERT FRONTEND
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ÉTAPE 4/5: BUILD ET TRANSFERT FRONTEND${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▶${NC} Build du frontend..."
cd frontend
npm run build
cd ..

echo -e "${YELLOW}▶${NC} Transfert des fichiers buildés..."
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

echo -e "${YELLOW}▶${NC} Redémarrage de l'API avec PM2..."
ssh ${SSH_USER}@${SERVER} "pm2 restart indebel-api"

echo -e "${YELLOW}▶${NC} Vérification du status PM2..."
ssh ${SSH_USER}@${SERVER} "pm2 status indebel-api"

echo -e "${GREEN}✅${NC} API redémarrée"
echo ""

# ============================================
# GÉNÉRATION DES FACTURES RÉTROACTIVES
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}BONUS: GÉNÉRATION FACTURES RÉTROACTIVES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

read -p "Générer les factures rétroactives pour les utilisateurs existants? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}▶${NC} Génération des factures rétroactives..."
    
    # Créer un script temporaire pour générer les factures
    ssh ${SSH_USER}@${SERVER} "cd ${BACKEND_DIR} && node -e \"
const db = require('./config/database');
const FactureService = require('./services/factureService');

(async () => {
  try {
    const conn = await db.getConnection();
    const [users] = await conn.query(\\\`
      SELECT u.*, f.prix_mensuel 
      FROM users u
      JOIN forfaits f ON u.forfait_id = f.id
      WHERE u.forfait_id IS NOT NULL 
      AND f.prix_mensuel > 0 
      AND u.forfait_date_debut IS NOT NULL
    \\\`);
    
    console.log(\\\`\\nGénération de \\\${users.length} factures...\\n\\\`);
    
    let created = 0;
    for(const user of users) {
      try {
        const [existing] = await conn.query(
          'SELECT id FROM factures_forfaits WHERE user_id = ? AND forfait_id = ?',
          [user.id, user.forfait_id]
        );
        
        if(existing.length === 0) {
          await FactureService.creerFacture(
            conn, 
            user.id, 
            user.forfait_id, 
            user.forfait_date_debut, 
            user.forfait_date_fin
          );
          created++;
        }
      } catch(e) {
        console.error(\\\`Erreur \\\${user.email}:\\\`, e.message);
      }
    }
    
    console.log(\\\`\\n✅ \\\${created} factures créées\\\`);
    conn.release();
    process.exit(0);
  } catch(error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();
\""
    
    echo -e "${GREEN}✅${NC} Factures rétroactives générées"
else
    echo -e "${YELLOW}⏭️${NC}  Génération des factures rétroactives ignorée"
fi

echo ""

# ============================================
# RÉSUMÉ
# ============================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║          ✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ✅          ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📋 Résumé:${NC}"
echo -e "  ✅ Table factures_forfaits créée"
echo -e "  ✅ Package pdfkit installé"
echo -e "  ✅ Fichiers backend transférés"
echo -e "  ✅ Frontend buildé et déployé"
echo -e "  ✅ API redémarrée"
echo ""

echo -e "${BLUE}🔗 URLs:${NC}"
echo -e "  Frontend: https://pro.indebel.be"
echo -e "  API: https://api.indebel.be"
echo ""

echo -e "${BLUE}📝 Nouveautés:${NC}"
echo -e "  • Page utilisateur: /freelancer/factures ou /employer/factures"
echo -e "  • Page admin: /admin/factures"
echo -e "  • Génération automatique après paiement"
echo -e "  • Téléchargement PDF"
echo ""

echo -e "${GREEN}🎉 Le système de facturation est opérationnel en production!${NC}"
echo ""
