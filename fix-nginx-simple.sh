#!/bin/bash

# Fix Nginx configuration - Version simple

SERVER="145.223.33.208"

echo "🔧 Correction Nginx - Version simple"
echo ""

ssh root@${SERVER} 'bash -s' << 'ENDSSH'

# 1. Supprimer les configs custom qui posent problème
rm -f /etc/nginx/conf.d/api-proxy.conf
rm -f /etc/nginx/conf.d/api-indebel-proxy.conf

# 2. Restaurer config Plesk si désactivée
mv /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf.disabled /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf 2>/dev/null || true

# 3. Vérifier que le backend écoute
echo "Backend sur port 5000:"
netstat -tuln | grep 5000 || echo "Port 5000 non trouvé"

# 4. Test Nginx
echo ""
echo "Test Nginx:"
nginx -t

# 5. Si OK, recharger
if nginx -t 2>&1 | grep -q "successful"; then
    echo "Rechargement Nginx..."
    systemctl reload nginx
    echo "✅ Nginx rechargé"
else
    echo "❌ Erreur Nginx - config non rechargée"
fi

ENDSSH

echo ""
echo "✅ Terminé"
