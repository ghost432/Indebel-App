#!/bin/bash

# Solution CORS finale : Backend gère tout, Nginx = simple proxy
# Cette approche est la plus fiable et évite les conflits Nginx/Node.js

set -e

SERVER="145.223.33.208"
SSH_USER="root"
BACKEND_DIR="/var/www/vhosts/indebel.be/api.indebel.be"

echo "🔧 Configuration CORS finale - Backend gère tout"
echo ""

# 1. Vérifier que CORS_ORIGINS est correct
echo "📋 Étape 1: Vérification .env.production..."
ssh ${SSH_USER}@${SERVER} "cd ${BACKEND_DIR} && grep CORS_ORIGINS .env.production"
echo ""

# 2. Configurer Nginx en mode simple proxy (sans CORS)
echo "🔧 Étape 2: Configuration Nginx simple proxy..."
ssh ${SSH_USER}@${SERVER} 'cat > /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf << "EOF"
server {
    listen 80;
    listen [::]:80;
    server_name api.indebel.be;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name api.indebel.be;

    ssl_certificate /opt/psa/var/certificates/scf5p5Jtl;
    ssl_certificate_key /opt/psa/var/certificates/scf5p5Jtl;

    access_log /var/www/vhosts/indebel.be/logs/api_access.log;
    error_log /var/www/vhosts/indebel.be/logs/api_error.log;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
'

echo "✅ Configuration Nginx créée"
echo ""

# 3. Tester Nginx
echo "🧪 Étape 3: Test configuration Nginx..."
ssh ${SSH_USER}@${SERVER} "nginx -t"
echo ""

# 4. Recharger Nginx
echo "♻️ Étape 4: Rechargement Nginx..."
ssh ${SSH_USER}@${SERVER} "systemctl reload nginx"
echo "✅ Nginx rechargé"
echo ""

# 5. Redémarrer PM2
echo "♻️ Étape 5: Redémarrage PM2..."
ssh ${SSH_USER}@${SERVER} "pm2 restart indebel-api"
sleep 3
ssh ${SSH_USER}@${SERVER} "pm2 status indebel-api"
echo ""

# 6. Test CORS
echo "🧪 Étape 6: Test CORS..."
echo "Test OPTIONS:"
curl -I -X OPTIONS https://api.indebel.be/api/auth/login \
  -H "Origin: https://pro.indebel.be" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null | grep -i "access-control"

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "🌐 Tester maintenant:"
echo "   1. Ouvrir https://pro.indebel.be"
echo "   2. Essayer de se connecter"
echo ""
