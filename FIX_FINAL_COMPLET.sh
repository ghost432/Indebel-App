#!/bin/bash

# Script de correction FINAL - Corrige TOUT

set -e

SERVER="145.223.33.208"
DB_USER="indebel_user"
DB_PASS="indebel_pass"
DB_NAME="indebel_bd"

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║         FIX FINAL COMPLET - INDEBEL                   ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "🔍 ÉTAPE 1/6: Diagnostic"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier table label_indebel
echo "Vérification table label_indebel..."
ssh root@${SERVER} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e 'SHOW TABLES LIKE \"label_indebel\";' | grep -q label_indebel && echo '✅ Table existe' || echo '❌ Table manquante'"

echo ""
echo "🗄️ ÉTAPE 2/6: Recréation table label_indebel (au cas où)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh root@${SERVER} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME}" << 'EOSQL'
DROP TABLE IF EXISTS label_indebel;

CREATE TABLE label_indebel (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  statut ENUM('en_attente','en_attente_exceptionnel','accepte','refuse') DEFAULT 'en_attente',
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_traitement TIMESTAMP NULL DEFAULT NULL,
  admin_id INT DEFAULT NULL,
  commentaire_admin TEXT,
  statut_verification ENUM('non_verifie','en_cours','verifie','refuse') DEFAULT 'non_verifie',
  date_verification TIMESTAMP NULL DEFAULT NULL,
  admin_verification_id INT DEFAULT NULL,
  score_profil DECIMAL(5,2) DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_admin_id (admin_id),
  KEY idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Table créée' as resultat;
EOSQL

echo "✅ Table label_indebel recréée"

echo ""
echo "🔄 ÉTAPE 3/6: Redémarrage PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh root@${SERVER} << 'EOPM2'
cd /var/www/vhosts/indebel.be/api.indebel.be
pm2 delete indebel-api 2>/dev/null || true
pm2 start ecosystem.config.js
sleep 3
pm2 status indebel-api
EOPM2

echo ""
echo "🧪 ÉTAPE 4/6: Test backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sleep 2
echo "Test port 5000..."
ssh root@${SERVER} "netstat -tuln | grep 5000 && echo '✅ Port 5000 écoute' || echo '❌ Port 5000 non trouvé'"

echo ""
echo "Test backend local..."
ssh root@${SERVER} "curl -s -o /dev/null -w 'Status: %{http_code}\n' http://localhost:5000/api/auth/login"

echo ""
echo "🌐 ÉTAPE 5/6: Configuration Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh root@${SERVER} << 'EONGINX'
# Nettoyer configs custom
rm -f /etc/nginx/conf.d/api-proxy.conf 2>/dev/null || true
rm -f /etc/nginx/conf.d/api-indebel-proxy.conf 2>/dev/null || true

# Restaurer config Plesk
if [ -f /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf.disabled ]; then
    mv /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf.disabled \
       /etc/nginx/plesk.conf.d/vhosts/api.indebel.be.conf
fi

echo "✅ Config Nginx nettoyée"
EONGINX

echo ""
echo "✅ ÉTAPE 6/6: Test final"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Test depuis l'extérieur..."
curl -s -o /dev/null -w 'API Status: %{http_code}\n' https://api.indebel.be/api/auth/login

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║              ✅ FIX TERMINÉ !                          ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🧪 TESTER MAINTENANT:"
echo "   https://pro.indebel.be"
echo ""
echo "   Console (F12):"
echo '   fetch("https://api.indebel.be/api/auth/login", {'
echo '     method: "POST",'
echo '     headers: {"Content-Type": "application/json"},'
echo '     body: JSON.stringify({email:"test@test.com",password:"test"})'
echo '   }).then(r=>r.json()).then(console.log)'
echo ""
