#!/bin/bash

# ============================================
# Script de Déploiement sur Serveur Distant
# Exécute les commandes sur le serveur
# ============================================

SERVER="145.223.33.208"
PASSWORD="BelgiqueDreambis@272829"
FRONTEND_PATH="/var/www/vhosts/indebel.be/pro.indebel.be"
BACKEND_PATH="/var/www/vhosts/indebel.be/api.indebel.be"

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║        🚀 DÉPLOIEMENT SERVEUR INDEBEL 🚀              ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🔧 Configuration:"
echo "   Serveur: $SERVER"
echo "   Frontend: $FRONTEND_PATH"
echo "   Backend: $BACKEND_PATH"
echo ""
echo "📋 Je vais me connecter et configurer le serveur..."
echo ""

# Je vais créer un script temporaire qui sera exécuté sur le serveur
cat > /tmp/deploy_commands.sh << 'REMOTESCRIPT'
#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "🔍 ÉTAPE 1: Vérification de la structure actuelle"
echo "════════════════════════════════════════════════════════"

cd /var/www/vhosts/indebel.be/pro.indebel.be/
echo "📂 Contenu de pro.indebel.be:"
ls -la

echo ""
echo "════════════════════════════════════════════════════════"
echo "📦 ÉTAPE 2: Organisation des fichiers"
echo "════════════════════════════════════════════════════════"

# Vérifier si backend existe dans pro.indebel.be
if [ -d "/var/www/vhosts/indebel.be/pro.indebel.be/backend" ]; then
    echo "✅ Dossier backend trouvé, je le déplace vers api.indebel.be"
    
    # Créer le dossier api si nécessaire
    mkdir -p /var/www/vhosts/indebel.be/api.indebel.be
    
    # Déplacer backend
    cp -r /var/www/vhosts/indebel.be/pro.indebel.be/backend/* /var/www/vhosts/indebel.be/api.indebel.be/
    
    echo "✅ Backend déplacé vers /var/www/vhosts/indebel.be/api.indebel.be/"
fi

# Vérifier si frontend existe dans pro.indebel.be
if [ -d "/var/www/vhosts/indebel.be/pro.indebel.be/frontend" ]; then
    echo "✅ Dossier frontend trouvé"
    
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "🔨 ÉTAPE 3: Build du Frontend"
    echo "════════════════════════════════════════════════════════"
    
    cd /var/www/vhosts/indebel.be/pro.indebel.be/frontend
    
    # Installer les dépendances
    echo "📦 Installation des dépendances..."
    npm install
    
    # Build
    echo "🔨 Build du frontend..."
    npm run build
    
    # Déplacer les fichiers buildés à la racine
    echo "📁 Déplacement des fichiers buildés..."
    rm -rf /var/www/vhosts/indebel.be/pro.indebel.be/index.html
    rm -rf /var/www/vhosts/indebel.be/pro.indebel.be/assets
    cp -r dist/* /var/www/vhosts/indebel.be/pro.indebel.be/
    
    # Nettoyer
    cd /var/www/vhosts/indebel.be/pro.indebel.be/
    rm -rf frontend
    rm -rf backend
    
    echo "✅ Frontend buildé et déployé"
else
    echo "⚠️  Pas de dossier frontend trouvé"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "📝 ÉTAPE 4: Configuration .htaccess"
echo "════════════════════════════════════════════════════════"

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

echo "✅ .htaccess créé"

echo ""
echo "════════════════════════════════════════════════════════"
echo "🔧 ÉTAPE 5: Configuration Backend"
echo "════════════════════════════════════════════════════════"

cd /var/www/vhosts/indebel.be/api.indebel.be/

# Installer les dépendances backend
echo "📦 Installation des dépendances backend..."
npm install --production

echo ""
echo "════════════════════════════════════════════════════════"
echo "⚙️  ÉTAPE 6: Configuration PM2"
echo "════════════════════════════════════════════════════════"

# Créer ecosystem.config.js
cat > /var/www/vhosts/indebel.be/api.indebel.be/ecosystem.config.js << 'ECOEOF'
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
    max_memory_restart: '500M'
  }]
};
ECOEOF

# Créer dossier logs
mkdir -p /var/www/vhosts/indebel.be/api.indebel.be/logs

# Démarrer avec PM2
echo "🚀 Démarrage de l'API avec PM2..."
pm2 delete indebel-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "✅ API démarrée"

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ ÉTAPE 7: Vérifications"
echo "════════════════════════════════════════════════════════"

echo ""
echo "📂 Contenu Frontend (pro.indebel.be):"
ls -lah /var/www/vhosts/indebel.be/pro.indebel.be/ | head -20

echo ""
echo "📂 Contenu Backend (api.indebel.be):"
ls -lah /var/www/vhosts/indebel.be/api.indebel.be/ | head -20

echo ""
echo "🔍 Status PM2:"
pm2 status

echo ""
echo "📊 Logs API (dernières lignes):"
pm2 logs indebel-api --lines 20 --nostream

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ DÉPLOIEMENT TERMINÉ!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 Frontend: https://pro.indebel.be"
echo "🔌 API: https://api.indebel.be"
echo ""
echo "📝 Commandes utiles:"
echo "   pm2 status           - Voir le status"
echo "   pm2 logs indebel-api - Voir les logs"
echo "   pm2 restart indebel-api - Redémarrer"
echo ""

REMOTESCRIPT

echo "📤 Envoi du script sur le serveur..."
scp /tmp/deploy_commands.sh root@$SERVER:/tmp/

echo ""
echo "🚀 Exécution du déploiement sur le serveur..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh root@$SERVER "bash /tmp/deploy_commands.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Script terminé!"
echo ""
echo "🌐 Testez maintenant:"
echo "   Frontend: https://pro.indebel.be"
echo "   API: https://api.indebel.be"
echo ""
