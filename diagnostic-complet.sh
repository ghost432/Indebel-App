#!/bin/bash

# Script de diagnostic complet

SERVER="145.223.33.208"

echo "╔══════════════════════════════════════════════════╗"
echo "║    DIAGNOSTIC COMPLET - INDEBEL                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

echo "1️⃣ STATUS PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "pm2 status indebel-api"
echo ""

echo "2️⃣ LOGS PM2 (dernières lignes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "pm2 logs indebel-api --lines 15 --nostream"
echo ""

echo "3️⃣ PORTS ÉCOUTÉS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "netstat -tuln | grep -E 'LISTEN.*(5000|3000|8080)' || echo 'Aucun port backend trouvé'"
echo ""

echo "4️⃣ PROCESSUS NODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "ps aux | grep -E 'node|PM2' | grep -v grep | head -5"
echo ""

echo "5️⃣ CONFIG .ENV.PRODUCTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "cat /var/www/vhosts/indebel.be/api.indebel.be/.env.production | grep -E '(PORT|CORS|DB_|FRONTEND)'"
echo ""

echo "6️⃣ TEST CONNEXION BDD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "mysql -u indebel_user -p'indebel_pass' indebel_bd -e 'SELECT COUNT(*) as nb_users FROM users; SELECT COUNT(*) as nb_factures FROM factures_forfaits; SELECT COUNT(*) as nb_pwa FROM pwa_installations;' 2>&1"
echo ""

echo "7️⃣ TEST BACKEND LOCAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "curl -s -o /dev/null -w 'Status: %{http_code}\n' http://localhost:5000/api/auth/login 2>&1 || curl -s -o /dev/null -w 'Status: %{http_code}\n' http://localhost:3000/api/auth/login 2>&1 || echo 'Backend ne répond pas'"
echo ""

echo "8️⃣ CONFIG NGINX"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "nginx -t 2>&1 && echo '' && ls -la /etc/nginx/plesk.conf.d/vhosts/ | grep indebel"
echo ""

echo "9️⃣ FICHIER SERVER.JS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh root@${SERVER} "head -50 /var/www/vhosts/indebel.be/api.indebel.be/server.js | grep -A 5 'app.listen\|PORT'"
echo ""

echo "╔══════════════════════════════════════════════════╗"
echo "║    FIN DU DIAGNOSTIC                             ║"
echo "╚══════════════════════════════════════════════════╝"
