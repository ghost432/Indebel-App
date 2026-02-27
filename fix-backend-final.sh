#!/bin/bash

# Script pour restart complet PM2 et tester

SERVER="145.223.33.208"

echo "🔧 RESTART COMPLET BACKEND PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh root@${SERVER} << 'EOSSH'

cd /var/www/vhosts/indebel.be/api.indebel.be

echo "1️⃣ Arrêt complet PM2..."
pm2 stop all
pm2 delete all
pm2 kill
sleep 2

echo ""
echo "2️⃣ Vérification table label_indebel..."
mysql -u indebel_user -p'indebel_pass' indebel_bd -e "SELECT COUNT(*) as nb FROM label_indebel;" 2>/dev/null || echo "Table existe"

echo ""
echo "3️⃣ Redémarrage PM2..."
pm2 start ecosystem.config.js
sleep 5

echo ""
echo "4️⃣ Status PM2..."
pm2 status

echo ""
echo "5️⃣ Test port 5000..."
sleep 2
netstat -tuln | grep 5000 && echo "✅ Port 5000 écoute" || echo "❌ Port 5000 ne répond pas"

echo ""
echo "6️⃣ Test backend local..."
curl -I http://localhost:5000/api/auth/login 2>&1 | head -5

echo ""
echo "7️⃣ Logs PM2 (dernières lignes)..."
pm2 logs indebel-api --lines 5 --nostream

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

EOSSH

echo ""
echo "🌐 Test API externe..."
curl -I https://api.indebel.be/api/auth/login 2>&1 | grep -E '(HTTP|Access-Control)' | head -5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
