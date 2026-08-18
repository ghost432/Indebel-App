#!/bin/bash

# Script de déploiement frontend automatisé pour pro.indebel.be
# Usage: ./deploy-frontend-auto.sh

set -e

echo "🚀 Déploiement automatisé du frontend vers pro.indebel.be"

# Configuration
SERVER_IP="145.223.33.208"
SERVER_USER="root"
SERVER_PASS="BelgiqueDreambis@272829"
REMOTE_PATH="/var/www/vhosts/indebel.be/pro.indebel.be"
LOCAL_FRONTEND_PATH="$(cd "$(dirname "$0")/frontend" && pwd)"

# Étape 1: Build du frontend (déjà fait)
echo "✅ Le build a déjà été effectué dans frontend/dist/"

# Étape 2: Sauvegarde de l'ancien déploiement
echo "💾 Sauvegarde de l'ancien déploiement..."
sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
  "cd ${REMOTE_PATH} && tar -czf backup-\$(date +%Y%m%d-%H%M%S).tar.gz *.html assets/ images/ 2>/dev/null || true"

# Étape 3: Transfert des fichiers
echo "📤 Transfert des fichiers vers le serveur..."
sshpass -p "${SERVER_PASS}" rsync -avz -e "ssh -o StrictHostKeyChecking=no" ${LOCAL_FRONTEND_PATH}/dist/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

# Étape 4: Vérification des permissions
echo "🔒 Vérification des permissions..."
sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
  "chown -R indebel.be_2onhxvmxsxu:psacln ${REMOTE_PATH}/* && chmod -R 755 ${REMOTE_PATH}"

# Étape 5: Vérification du déploiement
echo "🔍 Vérification du déploiement..."
sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
  "ls -lah ${REMOTE_PATH}/ | head -15"

echo ""
echo "✅ Déploiement terminé avec succès!"
echo "🌐 Site disponible sur: https://pro.indebel.be"
echo ""
echo "🧪 Vérifications à effectuer:"
echo "   - Ouvrir https://pro.indebel.be dans le navigateur"
echo "   - Vérifier que les badges s'affichent correctement"
echo "   - Vérifier qu'il n'y a plus d'erreurs 404 dans la console"
echo "   - Vérifier que les appels API vont vers pro.indebel.be/api"
