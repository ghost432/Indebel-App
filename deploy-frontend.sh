#!/bin/bash

# Script de déploiement frontend pour pro.indebel.be
# Usage: ./deploy-frontend.sh

set -e

echo "🚀 Déploiement du frontend vers pro.indebel.be"

# Configuration
SERVER_IP="145.223.33.208"
SERVER_USER="root"
REMOTE_PATH="/var/www/vhosts/indebel.be/pro.indebel.be"
LOCAL_FRONTEND_PATH="$(cd "$(dirname "$0")/frontend" && pwd)"

# Étape 1: Build du frontend
echo "📦 Build du frontend en mode production..."
cd "$LOCAL_FRONTEND_PATH"
npm run build:prod

# Étape 2: Sauvegarde de l'ancien déploiement
echo "💾 Sauvegarde de l'ancien déploiement..."
ssh ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz *.html assets/ images/ 2>/dev/null || true"

# Étape 3: Transfert des fichiers
echo "📤 Transfert des fichiers vers le serveur..."
scp -r dist/* ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

# Étape 4: Vérification des permissions
echo "🔒 Vérification des permissions..."
ssh ${SERVER_USER}@${SERVER_IP} "chown -R indebel.be_2onhxvmxsxu:psacln ${REMOTE_PATH}/* && chmod -R 755 ${REMOTE_PATH}"

echo "✅ Déploiement terminé avec succès!"
echo "🌐 Site disponible sur: https://pro.indebel.be"
