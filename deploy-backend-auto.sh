#!/bin/bash
set -e
SERVER_IP="145.223.33.208"
SERVER_USER="root"
SERVER_PASS="BelgiqueDreambis@272829"
REMOTE_PATH="/var/www/vhosts/indebel.be/api.indebel.be"
LOCAL_BACKEND_PATH="$(cd "$(dirname "$0")/backend" && pwd)"

echo "📤 Transfert du backend vers le serveur..."
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no -r ${LOCAL_BACKEND_PATH}/controllers ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no -r ${LOCAL_BACKEND_PATH}/config ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no -r ${LOCAL_BACKEND_PATH}/services ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no -r ${LOCAL_BACKEND_PATH}/scripts ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no -r ${LOCAL_BACKEND_PATH}/routes ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

echo "🔄 Redémarrage de l'API..."
sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "pm2 restart indebel-api"

echo "✅ Backend déployé et redémarré!"
