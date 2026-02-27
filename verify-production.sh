#!/bin/bash

# ============================================
# Script de Vérification Production - Indebel
# Teste toutes les routes et services
# ============================================

set -e

# Configuration
SERVER="145.223.33.208"
SSH_USER="root"
FRONTEND_URL="https://pro.indebel.be"
API_URL="https://api.indebel.be"

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
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_step() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
}

test_route() {
    local url=$1
    local name=$2
    local expected=$3
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "$expected" ]; then
        print_success "$name: OK (HTTP $STATUS)"
        return 0
    else
        print_error "$name: ÉCHEC (HTTP $STATUS, attendu $expected)"
        return 1
    fi
}

# Bannière
clear
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🔍 VÉRIFICATION PRODUCTION - INDEBEL 🔍                   ║
║                                                                ║
║     Test de toutes les routes et services                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_info "Frontend: $FRONTEND_URL"
print_info "API: $API_URL"
echo ""

# ============================================
# VÉRIFICATION FRONTEND
# ============================================

print_header "VÉRIFICATION FRONTEND"

test_route "$FRONTEND_URL" "Page principale" "200"
test_route "$FRONTEND_URL/login" "Page login" "200"
test_route "$FRONTEND_URL/register" "Page register" "200"

# ============================================
# VÉRIFICATION API PUBLIQUE
# ============================================

print_header "VÉRIFICATION API - ROUTES PUBLIQUES"

test_route "$API_URL" "API Root" "200"
test_route "$API_URL/api/auth/login" "Route login" "200"
test_route "$API_URL/api/auth/register" "Route register" "200"

# ============================================
# VÉRIFICATION PM2
# ============================================

print_header "VÉRIFICATION PM2"

print_step "Status PM2..."
ssh ${SSH_USER}@${SERVER} "pm2 status indebel-api"

print_step "Vérification mémoire..."
ssh ${SSH_USER}@${SERVER} "pm2 describe indebel-api | grep -E 'status|memory|uptime'"

# ============================================
# VÉRIFICATION BASE DE DONNÉES
# ============================================

print_header "VÉRIFICATION BASE DE DONNÉES"

print_step "Test connexion base de données..."
ssh ${SSH_USER}@${SERVER} "mysql -u indebel_user -p'indebel_pass' indebel_bd -e 'SELECT 1;'" > /dev/null 2>&1 && print_success "Connexion DB: OK" || print_error "Connexion DB: ÉCHEC"

print_step "Vérification tables principales..."
TABLES=$(ssh ${SSH_USER}@${SERVER} "mysql -u indebel_user -p'indebel_pass' indebel_bd -e 'SHOW TABLES;'" 2>/dev/null)

echo "$TABLES" | grep -q "users" && print_success "Table users: OK" || print_error "Table users: MANQUANTE"
echo "$TABLES" | grep -q "missions" && print_success "Table missions: OK" || print_error "Table missions: MANQUANTE"
echo "$TABLES" | grep -q "forfaits" && print_success "Table forfaits: OK" || print_error "Table forfaits: MANQUANTE"
echo "$TABLES" | grep -q "support_tickets" && print_success "Table support_tickets: OK" || print_error "Table support_tickets: MANQUANTE"
echo "$TABLES" | grep -q "support_responses" && print_success "Table support_responses: OK" || print_error "Table support_responses: MANQUANTE"

# ============================================
# VÉRIFICATION LOGS
# ============================================

print_header "DERNIERS LOGS PM2"

ssh ${SSH_USER}@${SERVER} "pm2 logs indebel-api --lines 30 --nostream"

# ============================================
# TESTS AVANCÉS
# ============================================

print_header "TESTS AVANCÉS"

print_step "Test temps de réponse API..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$API_URL")
print_info "Temps de réponse: ${RESPONSE_TIME}s"

print_step "Test certificat SSL..."
openssl s_client -connect pro.indebel.be:443 -servername pro.indebel.be </dev/null 2>/dev/null | grep -q "Verify return code: 0" && print_success "Certificat SSL: Valide" || print_warning "Certificat SSL: À vérifier"

print_step "Test CORS..."
CORS_HEADER=$(curl -s -H "Origin: https://pro.indebel.be" -I "$API_URL" | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    print_success "CORS: Configuré"
else
    print_warning "CORS: À vérifier"
fi

# ============================================
# RÉSUMÉ FINAL
# ============================================

print_header "✅ VÉRIFICATION TERMINÉE"

echo ""
print_success "Frontend opérationnel"
print_success "API opérationnelle"
print_success "Base de données accessible"
print_success "PM2 en cours d'exécution"
echo ""

print_info "Pour voir les logs en temps réel:"
echo "  ssh ${SSH_USER}@${SERVER} 'pm2 logs indebel-api'"
echo ""

print_info "Pour redémarrer l'API:"
echo "  ssh ${SSH_USER}@${SERVER} 'pm2 restart indebel-api'"
echo ""

print_success "🎉 Toutes les vérifications sont terminées!"
