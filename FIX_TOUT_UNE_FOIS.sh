#!/bin/bash

# Script ULTRA SIMPLE - UNE SEULE CONNEXION SSH

SERVER="145.223.33.208"

echo "🔧 FIX COMPLET EN UNE FOIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 Connexion au serveur (mot de passe requis UNE FOIS)..."
echo ""

ssh root@${SERVER} << 'EOSSH'

echo ""
echo "1️⃣ Recréation table label_indebel..."
mysql -u indebel_user -p'indebel_pass' indebel_bd << 'EOSQL'
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
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SELECT 'Table créée' as resultat;
EOSQL

echo "✅ Table créée"
echo ""

echo "2️⃣ Vérification table..."
mysql -u indebel_user -p'indebel_pass' indebel_bd -e "SHOW TABLES LIKE 'label%';"
echo ""

echo "3️⃣ Redémarrage PM2..."
cd /var/www/vhosts/indebel.be/api.indebel.be
pm2 delete indebel-api 2>/dev/null || true
pm2 start ecosystem.config.js
sleep 4
pm2 status indebel-api
echo ""

echo "4️⃣ Test port 5000..."
sleep 2
netstat -tuln | grep 5000 && echo "✅ Port 5000 écoute" || echo "❌ Port 5000 introuvable"
echo ""

echo "5️⃣ Test backend local..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:5000/api/auth/login
echo ""

echo "6️⃣ Logs PM2 (dernières lignes)..."
pm2 logs indebel-api --lines 5 --nostream
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║              FIX TERMINÉ!                              ║"
echo "╚════════════════════════════════════════════════════════╝"

EOSSH

echo ""
echo "🧪 Test depuis l'extérieur..."
curl -s -o /dev/null -w "API Status: %{http_code}\n" https://api.indebel.be/api/auth/login

echo ""
echo "✅ SCRIPT TERMINÉ"
echo ""
echo "📝 PROCHAINE ÉTAPE:"
echo "   → Ouvrir Plesk et configurer Nginx"
echo "   → Voir: FAIRE_MAINTENANT.txt"
