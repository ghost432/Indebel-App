#!/bin/bash

# Script de vérification des routes sur le serveur

SERVER="145.223.33.208"
API_PATH="/var/www/vhosts/indebel.be/api.indebel.be"

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║     🔍 VÉRIFICATION ROUTES SERVEUR 🔍                 ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

ssh root@$SERVER << 'EOSSH'

echo "📍 Vérification de la structure du backend..."
cd /var/www/vhosts/indebel.be/api.indebel.be

echo ""
echo "📂 Structure des dossiers:"
ls -la | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 Fichier server.js:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "server.js" ]; then
    echo "✅ server.js existe"
    head -30 server.js
else
    echo "❌ server.js n'existe pas!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Recherche de la route du logo..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Chercher dans server.js
if [ -f "server.js" ]; then
    echo "Dans server.js:"
    grep -n "logo\|/static\|express.static" server.js || echo "Aucune route logo trouvée dans server.js"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Vérification du dossier public/uploads:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "public" ]; then
    echo "✅ Dossier public existe"
    ls -la public/
    
    if [ -d "public/uploads" ]; then
        echo ""
        echo "✅ Dossier public/uploads existe"
        ls -la public/uploads/ | head -20
    else
        echo "❌ Dossier public/uploads n'existe pas!"
    fi
else
    echo "❌ Dossier public n'existe pas!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Fichiers de routes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "routes" ]; then
    echo "✅ Dossier routes existe"
    ls -la routes/
else
    echo "❌ Dossier routes n'existe pas!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Configuration .env:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    echo "✅ Fichier .env existe"
    echo "PORT et URLs:"
    grep -E "^PORT=|^BACKEND_URL=|^FRONTEND_URL=" .env || echo "Variables non trouvées"
else
    echo "❌ Fichier .env n'existe pas!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Status PM2:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pm2 status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Logs PM2 (20 dernières lignes):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pm2 logs indebel-api --lines 20 --nostream 2>/dev/null || echo "Pas de logs disponibles"

EOSSH

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✅ VÉRIFICATION TERMINÉE ✅                   ║"
echo "╚════════════════════════════════════════════════════════╝"
