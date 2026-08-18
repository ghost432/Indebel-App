#!/bin/bash
# ==============================================
# DÉPLOIEMENT DU FICHIER SQL SUR LE SERVEUR
# ==============================================

set -e  # Arrêter en cas d'erreur

# Configuration
SERVER="89.116.245.231"
SERVER_USER="root"
SQL_FILE="IMPORT_PHPMYADMIN_OPTIMAL.sql"
REMOTE_PATH="/root"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}   DÉPLOIEMENT FICHIER SQL SUR SERVEUR${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

# Vérifier que le fichier existe
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Erreur: Fichier $SQL_FILE introuvable!${NC}"
    exit 1
fi

# Afficher la taille du fichier
FILE_SIZE=$(du -h "$SQL_FILE" | cut -f1)
echo -e "${GREEN}📁 Fichier à transférer:${NC} $SQL_FILE ($FILE_SIZE)"

# Étape 1: Transférer le fichier
echo -e "\n${BLUE}📤 Étape 1: Transfert du fichier SQL...${NC}"
scp "$SQL_FILE" "$SERVER_USER@$SERVER:$REMOTE_PATH/" && \
    echo -e "${GREEN}✅ Fichier transféré avec succès${NC}" || \
    { echo -e "${RED}❌ Erreur lors du transfert${NC}"; exit 1; }

# Étape 2: Vérifier la présence du fichier sur le serveur
echo -e "\n${BLUE}🔍 Étape 2: Vérification sur le serveur...${NC}"
ssh "$SERVER_USER@$SERVER" "ls -lh $REMOTE_PATH/$SQL_FILE" && \
    echo -e "${GREEN}✅ Fichier présent sur le serveur${NC}" || \
    { echo -e "${RED}❌ Fichier non trouvé sur le serveur${NC}"; exit 1; }

# Afficher les instructions d'importation
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📋 PROCHAINES ÉTAPES:${NC}\n"

echo -e "${BLUE}MÉTHODE 1 - Via phpMyAdmin (RECOMMANDÉ):${NC}"
echo -e "1. Accédez à phpMyAdmin sur votre serveur"
echo -e "2. Connectez-vous avec vos identifiants MySQL"
echo -e "3. Supprimez l'ancienne base (si elle existe):"
echo -e "   ${GREEN}DROP DATABASE IF EXISTS indebel_bd;${NC}"
echo -e "4. Créez une nouvelle base:"
echo -e "   ${GREEN}CREATE DATABASE indebel_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;${NC}"
echo -e "5. Sélectionnez la base 'indebel_bd'"
echo -e "6. Cliquez sur 'Importer', choisissez le fichier et lancez l'import"

echo -e "\n${BLUE}MÉTHODE 2 - Via ligne de commande:${NC}"
echo -e "1. Connectez-vous au serveur:"
echo -e "   ${GREEN}ssh $SERVER_USER@$SERVER${NC}"
echo -e "2. Supprimez l'ancienne base:"
echo -e "   ${GREEN}mysql -u root -p -e \"DROP DATABASE IF EXISTS indebel_bd;\"${NC}"
echo -e "3. Créez une nouvelle base:"
echo -e "   ${GREEN}mysql -u root -p -e \"CREATE DATABASE indebel_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"${NC}"
echo -e "4. Importez le fichier:"
echo -e "   ${GREEN}mysql -u root -p indebel_bd < $REMOTE_PATH/$SQL_FILE${NC}"

echo -e "\n${BLUE}VÉRIFICATION:${NC}"
echo -e "${GREEN}mysql -u root -p -e \"USE indebel_bd; SHOW TABLES;\"${NC}"
echo -e "${GREEN}mysql -u root -p -e \"USE indebel_bd; SELECT COUNT(*) FROM users;\"${NC}"

echo -e "\n${YELLOW}⚠️  ATTENTION:${NC}"
echo -e "- Cette opération va SUPPRIMER toutes les données existantes"
echo -e "- Assurez-vous d'avoir une sauvegarde avant de continuer"
echo -e "- Le fichier SQL contient 18 tables et 24 contraintes"

echo -e "\n${GREEN}📝 Documentation complète: SOLUTION_IMPORT_BD.md${NC}\n"
