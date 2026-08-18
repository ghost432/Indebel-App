#!/bin/bash

# ============================================
# Script de Déploiement Automatique - Indebel
# pro.indebel.be + api.indebel.be
# ============================================

set -e

# Configuration
SERVER="145.223.33.208"
SSH_USER="root"
FRONTEND_PATH="/var/www/vhosts/indebel.be/pro.indebel.be"
BACKEND_PATH="/var/www/vhosts/indebel.be/api.indebel.be"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonctions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
}

# Bannière
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════╗
║                                                        ║
║        🚀 DÉPLOIEMENT AUTOMATIQUE INDEBEL 🚀          ║
║                                                        ║
║         pro.indebel.be + api.indebel.be               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_info "Serveur: $SERVER"
print_info "Frontend: https://pro.indebel.be"
print_info "API: https://pro.indebel.be/api"
echo ""

# Menu
echo -e "${YELLOW}Que voulez-vous déployer?${NC}"
echo "1) Déploiement COMPLET (Frontend + Backend)"
echo "2) Frontend uniquement"
echo "3) Backend uniquement"
echo "4) Redémarrer l'API (PM2)"
echo "5) Voir les logs PM2"
echo "6) Status PM2"
echo "7) Quitter"
echo ""
read -p "Votre choix [1-7]: " choice

case $choice in
    1)
        DEPLOY_FRONTEND=true
        DEPLOY_BACKEND=true
        print_header "DÉPLOIEMENT COMPLET"
        ;;
    2)
        DEPLOY_FRONTEND=true
        DEPLOY_BACKEND=false
        print_header "DÉPLOIEMENT FRONTEND"
        ;;
    3)
        DEPLOY_FRONTEND=false
        DEPLOY_BACKEND=true
        print_header "DÉPLOIEMENT BACKEND"
        ;;
    4)
        print_header "REDÉMARRAGE API"
        ssh ${SSH_USER}@${SERVER} "cd ${BACKEND_PATH} && pm2 restart indebel-api"
        print_success "API redémarrée"
        ssh ${SSH_USER}@${SERVER} "pm2 status"
        exit 0
        ;;
    5)
        print_header "LOGS PM2"
        ssh ${SSH_USER}@${SERVER} "pm2 logs indebel-api"
        exit 0
        ;;
    6)
        print_header "STATUS PM2"
        ssh ${SSH_USER}@${SERVER} "pm2 status"
        exit 0
        ;;
    7)
        print_info "Au revoir!"
        exit 0
        ;;
    *)
        print_error "Choix invalide"
        exit 1
        ;;
esac

# ============================================
# DÉPLOIEMENT FRONTEND
# ============================================

if [ "$DEPLOY_FRONTEND" = true ]; then
    print_header "ÉTAPE 1: BUILD FRONTEND"
    
    print_step "Installation des dépendances..."
    cd frontend
    npm install
    
    print_step "Build pour production..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Le dossier dist n'a pas été créé"
        exit 1
    fi
    
    print_success "Build terminé"
    cd ..
    
    print_header "ÉTAPE 2: TRANSFERT FRONTEND"
    
    print_step "Transfert des fichiers vers le serveur..."
    
    # Vérifier si rsync est disponible
    if command -v rsync &> /dev/null; then
        print_info "Utilisation de rsync (rapide)"
        rsync -avz --delete frontend/dist/ ${SSH_USER}@${SERVER}:${FRONTEND_PATH}/
    else
        print_info "Utilisation de scp"
        ssh ${SSH_USER}@${SERVER} "rm -rf ${FRONTEND_PATH}/*"
        scp -r frontend/dist/* ${SSH_USER}@${SERVER}:${FRONTEND_PATH}/
    fi
    
    print_success "Frontend transféré"
    
    print_header "ÉTAPE 3: CONFIGURATION .htaccess"
    
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
    
    print_success ".htaccess créé"
fi

# ============================================
# DÉPLOIEMENT BACKEND
# ============================================

if [ "$DEPLOY_BACKEND" = true ]; then
    print_header "ÉTAPE 4: PRÉPARATION BACKEND"
    
    print_step "Création de l'archive backend..."
    cd backend
    tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf ../backend.tar.gz .
    cd ..
    
    print_success "Archive créée"
    
    print_header "ÉTAPE 5: TRANSFERT BACKEND"
    
    print_step "Transfert de l'archive..."
    scp backend.tar.gz ${SSH_USER}@${SERVER}:/tmp/
    
    print_step "Extraction sur le serveur..."
    ssh ${SSH_USER}@${SERVER} << EOF
cd ${BACKEND_PATH}
tar -xzf /tmp/backend.tar.gz
rm /tmp/backend.tar.gz
EOF
    
    print_success "Backend transféré"
    
    print_step "Nettoyage local..."
    rm backend.tar.gz
    
    print_header "ÉTAPE 6: FICHIER .env"
    
    print_step "Transfert du fichier .env..."
    scp backend/.env.production ${SSH_USER}@${SERVER}:${BACKEND_PATH}/.env
    
    print_success ".env transféré"
    
    print_header "ÉTAPE 7: INSTALLATION DÉPENDANCES"
    
    print_step "Installation des packages npm..."
    ssh ${SSH_USER}@${SERVER} << EOF
cd ${BACKEND_PATH}
npm install --production
EOF
    
    print_success "Dépendances installées"
    
    print_header "ÉTAPE 8: CONFIGURATION PM2"
    
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
    
    print_success "Configuration PM2 créée"
    
    print_step "Création du dossier logs..."
    ssh ${SSH_USER}@${SERVER} << EOF
mkdir -p ${BACKEND_PATH}/logs
chown -R www-data:www-data ${BACKEND_PATH}/logs 2>/dev/null || true
EOF
    
    print_header "ÉTAPE 9: DÉMARRAGE API"
    
    print_step "Redémarrage avec PM2..."
    ssh ${SSH_USER}@${SERVER} << EOF
cd ${BACKEND_PATH}
pm2 delete indebel-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
EOF
    
    print_success "API démarrée"
fi

# ============================================
# VÉRIFICATIONS
# ============================================

print_header "ÉTAPE 10: VÉRIFICATIONS"

if [ "$DEPLOY_FRONTEND" = true ]; then
    print_step "Test Frontend..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://pro.indebel.be)
    if [ "$FRONTEND_STATUS" = "200" ]; then
        print_success "Frontend accessible (HTTP $FRONTEND_STATUS)"
    else
        print_error "Frontend retourne HTTP $FRONTEND_STATUS"
    fi
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    print_step "Test API..."
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://pro.indebel.be/api)
    if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "404" ]; then
        print_success "API accessible (HTTP $API_STATUS)"
    else
        print_error "API retourne HTTP $API_STATUS"
    fi
    
    print_step "Status PM2..."
    ssh ${SSH_USER}@${SERVER} "pm2 status"
fi

# ============================================
# RÉSUMÉ FINAL
# ============================================

print_header "DÉPLOIEMENT TERMINÉ"

echo ""
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo -e "${GREEN}✅ Frontend déployé: https://pro.indebel.be${NC}"
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    echo -e "${GREEN}✅ Backend déployé: https://pro.indebel.be/api${NC}"
    echo -e "${GREEN}✅ API PM2: indebel-api${NC}"
fi

echo ""
print_info "Commandes utiles:"
echo "  - Voir logs: ssh ${SSH_USER}@${SERVER} 'pm2 logs indebel-api'"
echo "  - Redémarrer: ssh ${SSH_USER}@${SERVER} 'pm2 restart indebel-api'"
echo "  - Status: ssh ${SSH_USER}@${SERVER} 'pm2 status'"
echo ""

print_success "Déploiement réussi! 🎉"
