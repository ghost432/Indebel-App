#!/bin/bash

# ============================================
# Script d'Import BD Local -> Serveur
# ============================================

set -e

SERVER="145.223.33.208"
SERVER_USER="indebel_user"
SERVER_PASS="indebel_pass"
SERVER_DB="indebel_bd"
SQL_FILE="/tmp/indebel_bd_export_for_server.sql"

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     📤 IMPORT BD LOCAL → SERVEUR DISTANT 📤           ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que le fichier SQL existe
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Erreur: Fichier SQL non trouvé: $SQL_FILE"
    exit 1
fi

echo "📊 Informations:"
echo "   Local:    root@localhost/indebel_bd"
echo "   Serveur:  $SERVER_USER@$SERVER/$SERVER_DB"
echo "   Fichier:  $SQL_FILE ($(ls -lh $SQL_FILE | awk '{print $5}'))"
echo ""

# Étape 1: Export local (déjà fait)
echo "✅ Étape 1: Export local terminé"
echo ""

# Étape 2: Transfert vers le serveur
echo "📤 Étape 2: Transfert du fichier SQL vers le serveur..."
scp -o StrictHostKeyChecking=no "$SQL_FILE" root@$SERVER:/tmp/indebel_import.sql
echo "✅ Fichier transféré"
echo ""

# Étape 3: Import sur le serveur
echo "📥 Étape 3: Import de la base de données sur le serveur..."
ssh -o StrictHostKeyChecking=no root@$SERVER << EOSSH
echo "🔧 Connexion au serveur établie"
echo ""

# Vérifier que MySQL est accessible
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé sur le serveur"
    exit 1
fi

# Créer la base si elle n'existe pas
echo "📋 Création de la base de données (si nécessaire)..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS $SERVER_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
mysql -e "CREATE DATABASE IF NOT EXISTS $SERVER_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Créer l'utilisateur et donner les permissions
echo "👤 Configuration de l'utilisateur $SERVER_USER..."
mysql -u root << EOMYSQL 2>/dev/null || mysql << EOMYSQL
-- Créer l'utilisateur s'il n'existe pas
CREATE USER IF NOT EXISTS '$SERVER_USER'@'localhost' IDENTIFIED BY '$SERVER_PASS';
CREATE USER IF NOT EXISTS '$SERVER_USER'@'%' IDENTIFIED BY '$SERVER_PASS';
CREATE USER IF NOT EXISTS '$SERVER_USER'@'127.0.0.1' IDENTIFIED BY '$SERVER_PASS';

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON $SERVER_DB.* TO '$SERVER_USER'@'localhost';
GRANT ALL PRIVILEGES ON $SERVER_DB.* TO '$SERVER_USER'@'%';
GRANT ALL PRIVILEGES ON $SERVER_DB.* TO '$SERVER_USER'@'127.0.0.1';

-- Appliquer les changements
FLUSH PRIVILEGES;
EOMYSQL

echo "✅ Utilisateur configuré"
echo ""

# Importer le fichier SQL
echo "💾 Import des données..."
mysql -u $SERVER_USER -p'$SERVER_PASS' $SERVER_DB < /tmp/indebel_import.sql 2>&1 | grep -v "Warning" || true

echo "✅ Données importées"
echo ""

# Vérifier l'import
echo "🔍 Vérification de l'import..."
TABLES=\$(mysql -u $SERVER_USER -p'$SERVER_PASS' $SERVER_DB -e "SHOW TABLES;" 2>/dev/null | wc -l)
USERS=\$(mysql -u $SERVER_USER -p'$SERVER_PASS' $SERVER_DB -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1)

echo "   Tables créées: \$((TABLES - 1))"
echo "   Utilisateurs: \$USERS"
echo ""

# Nettoyer
rm -f /tmp/indebel_import.sql
echo "🧹 Fichiers temporaires nettoyés"

EOSSH

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ IMPORT TERMINÉ AVEC SUCCÈS!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 Configuration serveur:"
echo "   Host:     localhost (sur le serveur)"
echo "   User:     $SERVER_USER"
echo "   Password: $SERVER_PASS"
echo "   Database: $SERVER_DB"
echo "   Port:     3306"
echo ""
echo "🧪 Test de connexion depuis le serveur:"
echo "   ssh root@$SERVER"
echo "   mysql -u $SERVER_USER -p'$SERVER_PASS' $SERVER_DB"
echo ""
