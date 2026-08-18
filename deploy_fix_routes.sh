#!/bin/bash

# Script pour déployer la correction des routes statiques

SERVER="145.223.33.208"
API_PATH="/var/www/vhosts/indebel.be/api.indebel.be"

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     🚀 DÉPLOIEMENT CORRECTION ROUTES 🚀               ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Étape 1: Backup du fichier actuel sur le serveur
echo "📦 Étape 1: Sauvegarde du fichier actuel sur le serveur..."
ssh root@$SERVER "cd $API_PATH && cp server.js server.js.backup && echo '✅ Backup créé: server.js.backup'" || echo "❌ Erreur backup"

echo ""

# Étape 2: Transférer le fichier corrigé
echo "📤 Étape 2: Transfert du fichier corrigé..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
scp "$SCRIPT_DIR/backend/server.js" root@$SERVER:$API_PATH/ && echo "✅ Fichier transféré" || echo "❌ Erreur transfert"

echo ""

# Étape 3: Créer les dossiers nécessaires
echo "📁 Étape 3: Création des dossiers public/uploads..."
ssh root@$SERVER << 'EOSSH'
cd /var/www/vhosts/indebel.be/api.indebel.be

# Créer les dossiers
mkdir -p public/uploads

# Définir les permissions
chmod 755 public
chmod 755 public/uploads

echo "✅ Dossiers créés avec permissions correctes"

# Vérifier
ls -la public/

EOSSH

echo ""

# Étape 4: Redémarrer PM2
echo "🔄 Étape 4: Redémarrage de l'API..."
ssh root@$SERVER "pm2 restart indebel-api && echo '✅ API redémarrée'"

echo ""

# Étape 5: Vérifier les logs
echo "📝 Étape 5: Vérification des logs..."
ssh root@$SERVER "pm2 logs indebel-api --lines 15 --nostream"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✅ DÉPLOIEMENT TERMINÉ ✅                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🧪 Tests à effectuer:"
echo ""
echo "1. Vérifier l'API:"
echo "   curl http://localhost:5000/"
echo ""
echo "2. Tester les fichiers statiques:"
echo "   curl -I http://localhost:5000/uploads/"
echo ""
echo "3. Voir les logs:"
echo "   pm2 logs indebel-api"
echo ""
