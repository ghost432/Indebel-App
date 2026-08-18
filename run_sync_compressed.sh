#!/bin/bash
set -e

SERVER="145.223.33.208"
SERVER_PASS="BelgiqueDreambis@272829"
DB_USER="indebel_user"
DB_PASS="indebel_pass"
DB_NAME="indebel_bd"

echo "📤 Transfert du fichier SQL (compressé) vers le serveur..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no /tmp/indebel_import.sql.gz root@$SERVER:/tmp/indebel_import.sql.gz

echo "📥 Import de la base de données sur le serveur..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER << EOSSH
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -u root -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
    mysql -u root -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
    mysql -u root -e "FLUSH PRIVILEGES;"
    # Extract and import
    zcat /tmp/indebel_import.sql.gz | mysql -u $DB_USER -p'$DB_PASS' $DB_NAME
    rm -f /tmp/indebel_import.sql.gz
EOSSH

echo "✅ IMPORT TERMINÉ AVEC SUCCÈS!"
