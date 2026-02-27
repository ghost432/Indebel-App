#!/bin/bash

# Script pour corriger CORS une fois pour toutes
# Nginx doit gérer les OPTIONS et ajouter les headers CORS

SERVER="145.223.33.208"
SSH_USER="root"

echo "🔧 Correction finale CORS Nginx..."

ssh ${SSH_USER}@${SERVER} 'cat > /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf << "EOF"
server {
    listen 80;
    listen [::]:80;
    server_name api.indebel.be;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.indebel.be;

    # SSL Configuration (géré par Plesk)
    ssl_certificate /opt/psa/var/certificates/scf5p5Jtl;
    ssl_certificate_key /opt/psa/var/certificates/scf5p5Jtl;

    # Logs
    access_log /var/www/vhosts/indebel.be/logs/api_access.log;
    error_log /var/www/vhosts/indebel.be/logs/api_error.log;

    # CORS Headers pour toutes les requêtes
    add_header Access-Control-Allow-Origin "https://pro.indebel.be" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Gérer les requêtes OPTIONS (preflight)
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin "https://pro.indebel.be" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age 3600 always;
        add_header Content-Length 0;
        add_header Content-Type "text/plain charset=UTF-8";
        return 204;
    }

    # Proxy vers Node.js sur port 5000
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
'

echo "✅ Configuration Nginx mise à jour"
echo ""
echo "🔄 Test de la configuration..."
ssh ${SSH_USER}@${SERVER} "nginx -t"

echo ""
echo "♻️ Rechargement Nginx..."
ssh ${SSH_USER}@${SERVER} "systemctl reload nginx"

echo ""
echo "✅ CORS configuré!"
echo ""
echo "🧪 Test avec curl:"
ssh ${SSH_USER}@${SERVER} "curl -I -X OPTIONS https://api.indebel.be/api/auth/login -H 'Origin: https://pro.indebel.be' -H 'Access-Control-Request-Method: POST'"
