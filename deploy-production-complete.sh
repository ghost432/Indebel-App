#!/bin/bash

# ============================================
# Script de Déploiement Complet - Indebel
# Migration des mises à jour locales vers Production
# Serveur: 145.223.33.208
# ============================================

set -e

# Configuration
SERVER="145.223.33.208"
SSH_USER="root"
SSH_PASS="BelgiqueDreambis@272829"
FRONTEND_PATH="/var/www/vhosts/indebel.be/pro.indebel.be"
BACKEND_PATH="/var/www/vhosts/indebel.be/api.indebel.be"
DB_NAME="indebel_bd"
DB_USER="indebel_user"
DB_PASS="indebel_pass"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Fonctions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_step() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Bannière
clear
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🚀 DÉPLOIEMENT COMPLET PRODUCTION - INDEBEL 🚀            ║
║                                                                ║
║     Migration complète des mises à jour locales               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_info "Serveur: $SERVER"
print_info "Frontend: https://pro.indebel.be"
print_info "API: https://api.indebel.be"
print_info "Base de données: $DB_NAME"
echo ""

# Confirmation
print_warning "Ce script va effectuer les opérations suivantes:"
echo "  1. Créer un backup de la base de données production"
echo "  2. Builder le frontend en mode production"
echo "  3. Transférer le frontend vers le serveur"
echo "  4. Transférer le backend vers le serveur"
echo "  5. Mettre à jour la base de données avec les nouvelles tables"
echo "  6. Redémarrer l'API avec PM2"
echo "  7. Vérifier toutes les routes"
echo ""
read -p "Voulez-vous continuer? (oui/non): " confirmation

if [ "$confirmation" != "oui" ]; then
    print_info "Déploiement annulé"
    exit 0
fi

# ============================================
# ÉTAPE 1: BACKUP BASE DE DONNÉES
# ============================================

print_header "ÉTAPE 1/7: BACKUP BASE DE DONNÉES PRODUCTION"

print_step "Création du backup de la base de données..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_production_${BACKUP_DATE}.sql"

ssh ${SSH_USER}@${SERVER} "mysqldump -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} > /tmp/${BACKUP_FILE}"
scp ${SSH_USER}@${SERVER}:/tmp/${BACKUP_FILE} ./backups/

print_success "Backup créé: ./backups/${BACKUP_FILE}"

# ============================================
# ÉTAPE 2: BUILD FRONTEND
# ============================================

print_header "ÉTAPE 2/7: BUILD FRONTEND"

print_step "Nettoyage du dossier dist..."
cd frontend
rm -rf dist

print_step "Installation des dépendances..."
npm install

print_step "Build pour production..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Le build du frontend a échoué"
fi

print_success "Frontend buildé avec succès"
cd ..

# ============================================
# ÉTAPE 3: TRANSFERT FRONTEND
# ============================================

print_header "ÉTAPE 3/7: TRANSFERT FRONTEND"

print_step "Backup de l'ancien frontend..."
ssh ${SSH_USER}@${SERVER} "cd ${FRONTEND_PATH} && tar -czf /tmp/frontend_backup_${BACKUP_DATE}.tar.gz . 2>/dev/null || true"

print_step "Transfert des nouveaux fichiers..."
if command -v rsync &> /dev/null; then
    print_info "Utilisation de rsync..."
    rsync -avz --delete frontend/dist/ ${SSH_USER}@${SERVER}:${FRONTEND_PATH}/
else
    print_info "Utilisation de scp..."
    ssh ${SSH_USER}@${SERVER} "rm -rf ${FRONTEND_PATH}/*"
    scp -r frontend/dist/* ${SSH_USER}@${SERVER}:${FRONTEND_PATH}/
fi

print_step "Création du fichier .htaccess..."
ssh ${SSH_USER}@${SERVER} << 'EOF'
cat > /var/www/vhosts/indebel.be/pro.indebel.be/.htaccess << 'HTACCESS'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
HTACCESS
EOF

print_success "Frontend transféré"

# ============================================
# ÉTAPE 4: TRANSFERT BACKEND
# ============================================

print_header "ÉTAPE 4/7: TRANSFERT BACKEND"

print_step "Création de l'archive backend..."
cd backend
tar --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='.env' -czf ../backend.tar.gz .
cd ..

print_step "Backup de l'ancien backend..."
ssh ${SSH_USER}@${SERVER} "cd ${BACKEND_PATH} && tar -czf /tmp/backend_backup_${BACKUP_DATE}.tar.gz . 2>/dev/null || true"

print_step "Transfert de l'archive..."
scp backend.tar.gz ${SSH_USER}@${SERVER}:/tmp/

print_step "Extraction sur le serveur..."
ssh ${SSH_USER}@${SERVER} << EOF
cd ${BACKEND_PATH}
tar -xzf /tmp/backend.tar.gz
rm /tmp/backend.tar.gz
EOF

print_step "Transfert du fichier .env de production..."
scp backend/.env.production ${SSH_USER}@${SERVER}:${BACKEND_PATH}/.env

print_step "Installation des dépendances..."
ssh ${SSH_USER}@${SERVER} << EOF
cd ${BACKEND_PATH}
npm install --production
EOF

print_step "Nettoyage local..."
rm backend.tar.gz

print_success "Backend transféré"

# ============================================
# ÉTAPE 5: MISE À JOUR BASE DE DONNÉES
# ============================================

print_header "ÉTAPE 5/7: MISE À JOUR BASE DE DONNÉES"

print_step "Utilisation du fichier SQL principal : indebel_bd.sql"

# Utiliser le fichier SQL principal qui contient toutes les tables
if [ -f "indebel_bd.sql" ]; then
    SQL_FILE="indebel_bd.sql"
    print_success "Fichier SQL trouvé: $SQL_FILE"
else
    print_error "Fichier indebel_bd.sql introuvable!"
    exit 1
fi

print_info "Utilisation du fichier: $SQL_FILE"

print_step "Transfert du fichier SQL..."
scp $SQL_FILE ${SSH_USER}@${SERVER}:/tmp/database_update.sql

print_step "Import dans la base de données..."
print_warning "Attention: Cela va remplacer toute la base de données!"
ssh ${SSH_USER}@${SERVER} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} < /tmp/database_update.sql"

ssh ${SSH_USER}@${SERVER} "rm /tmp/database_update.sql"

print_success "Base de données mise à jour avec indebel_bd.sql"

# ============================================
# ÉTAPE 6: REDÉMARRAGE PM2
# ============================================

print_header "ÉTAPE 6/7: REDÉMARRAGE API"

print_step "Création du fichier ecosystem.config.js..."
ssh ${SSH_USER}@${SERVER} << 'EOF'
cat > /var/www/vhosts/indebel.be/api.indebel.be/ecosystem.config.js << 'EOFINNER'
module.exports = {
  apps: [{
    name: 'indebel-api',
    script: 'server.js',
    cwd: '/var/www/vhosts/indebel.be/api.indebel.be',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/www/vhosts/indebel.be/api.indebel.be/logs/pm2-error.log',
    out_file: '/var/www/vhosts/indebel.be/api.indebel.be/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10
  }]
};
EOFINNER
EOF

print_step "Création du dossier logs..."
ssh ${SSH_USER}@${SERVER} "mkdir -p ${BACKEND_PATH}/logs"

print_step "Redémarrage de l'API avec PM2..."
ssh ${SSH_USER}@${SERVER} << EOF
cd ${BACKEND_PATH}
pm2 delete indebel-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
EOF

print_success "API redémarrée"

# ============================================
# ÉTAPE 7: VÉRIFICATIONS
# ============================================

print_header "ÉTAPE 7/7: VÉRIFICATIONS"

print_step "Attente du démarrage de l'API..."
sleep 5

print_step "Vérification du status PM2..."
ssh ${SSH_USER}@${SERVER} "pm2 status"

print_step "Test Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://pro.indebel.be)
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend accessible (HTTP $FRONTEND_STATUS)"
else
    print_warning "Frontend retourne HTTP $FRONTEND_STATUS"
fi

print_step "Test API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.indebel.be)
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "404" ]; then
    print_success "API accessible (HTTP $API_STATUS)"
else
    print_warning "API retourne HTTP $API_STATUS"
fi

print_step "Test routes principales..."

# Test route auth
curl -s https://api.indebel.be/api/auth/health > /dev/null 2>&1 && print_success "Route /api/auth: OK" || print_warning "Route /api/auth: Vérifier"

# Test route support
curl -s https://api.indebel.be/api/support/health > /dev/null 2>&1 && print_success "Route /api/support: OK" || print_warning "Route /api/support: Vérifier"

# Test route users
curl -s https://api.indebel.be/api/users/health > /dev/null 2>&1 && print_success "Route /api/users: OK" || print_warning "Route /api/users: Vérifier"

print_step "Affichage des derniers logs..."
ssh ${SSH_USER}@${SERVER} "pm2 logs indebel-api --lines 20 --nostream"

# ============================================
# RÉSUMÉ FINAL
# ============================================

print_header "✅ DÉPLOIEMENT TERMINÉ"

echo ""
print_success "Frontend déployé: https://pro.indebel.be"
print_success "Backend déployé: https://api.indebel.be"
print_success "API PM2: indebel-api"
print_success "Base de données mise à jour"
echo ""

print_info "Fichiers de backup créés:"
echo "  - Base de données: ./backups/${BACKUP_FILE}"
echo "  - Frontend: ${SERVER}:/tmp/frontend_backup_${BACKUP_DATE}.tar.gz"
echo "  - Backend: ${SERVER}:/tmp/backend_backup_${BACKUP_DATE}.tar.gz"
echo ""

print_info "Commandes utiles:"
echo "  - Voir logs: ssh ${SSH_USER}@${SERVER} 'pm2 logs indebel-api'"
echo "  - Redémarrer: ssh ${SSH_USER}@${SERVER} 'pm2 restart indebel-api'"
echo "  - Status: ssh ${SSH_USER}@${SERVER} 'pm2 status'"
echo ""

print_success "🎉 Déploiement réussi! L'application est maintenant en production."
