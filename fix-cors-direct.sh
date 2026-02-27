#!/bin/bash

# Script pour corriger CORS immédiatement en modifiant Nginx
set -e

SERVER="145.223.33.208"

echo "🔧 Correction CORS - Application immédiate"
echo ""

# 1. Vérifier PM2
echo "1️⃣ Vérification PM2..."
ssh root@${SERVER} "pm2 status indebel-api | grep -E '(online|errored)'" || true
echo ""

# 2. Test backend direct
echo "2️⃣ Test backend local (port 5000)..."
ssh root@${SERVER} "curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/api/auth/login"
echo " ← Status code"
echo ""

# 3. Modifier Nginx - Méthode simple qui marchera
echo "3️⃣ Configuration Nginx simple proxy..."
ssh root@${SERVER} 'bash -s' << 'ENDSSH'
# Backup
cp /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf /tmp/nginx-backup-$(date +%s).conf 2>/dev/null || true

# Créer config minimale dans le dossier principal
cat > /etc/nginx/conf.d/api-proxy.conf << 'EOF'
# Proxy simple pour api.indebel.be
# Backend gère CORS

upstream nodejs_api {
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.indebel.be;
    
    # SSL (laisser Plesk gérer)
    
    # Logs
    access_log /var/www/vhosts/indebel.be/logs/api_access.log;
    error_log /var/www/vhosts/indebel.be/logs/api_error.log;
    
    location / {
        proxy_pass http://nodejs_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
}
EOF

# Désactiver config Plesk qui pourrait causer conflit
mv /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf.disabled 2>/dev/null || true

echo "✅ Config créée"
ENDSSH

echo ""

# 4. Test Nginx
echo "4️⃣ Test configuration Nginx..."
if ssh root@${SERVER} "nginx -t 2>&1"; then
    echo ""
    echo "✅ Config OK"
    
    # 5. Reload
    echo ""
    echo "5️⃣ Rechargement Nginx..."
    ssh root@${SERVER} "systemctl reload nginx"
    echo "✅ Nginx rechargé"
    
    # 6. Redémarrer PM2
    echo ""
    echo "6️⃣ Redémarrage PM2..."
    ssh root@${SERVER} "pm2 restart indebel-api"
    sleep 2
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ CORS CONFIGURÉ!"
    echo ""
    echo "🧪 TESTER:"
    echo "   https://pro.indebel.be"
    echo ""
    echo "   Ou console (F12):"
    echo '   fetch("https://api.indebel.be/api/auth/login", {'
    echo '     method: "POST",'
    echo '     headers: {"Content-Type": "application/json"},'
    echo '     body: JSON.stringify({email:"test@test.com",password:"test"})'
    echo '   }).then(r=>r.json()).then(console.log)'
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ Erreur config Nginx"
    echo "Restauration..."
    ssh root@${SERVER} "mv /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf.disabled /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf 2>/dev/null || true"
    ssh root@${SERVER} "rm /etc/nginx/conf.d/api-proxy.conf 2>/dev/null || true"
fi
