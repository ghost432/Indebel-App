#!/bin/bash

# Script pour générer les icônes PWA à partir du logo

echo "🎨 Génération des icônes PWA..."

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick n'est pas installé. Installation..."
    echo "   Sur Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "   Sur MacOS: brew install imagemagick"
    exit 1
fi

# Chemins
LOGO_PATH="frontend/public/logo.png"
OUTPUT_DIR="frontend/public"

# Vérifier si le logo existe
if [ ! -f "$LOGO_PATH" ]; then
    echo "❌ Le logo n'existe pas: $LOGO_PATH"
    exit 1
fi

# Générer les icônes
echo "📦 Génération de pwa-icon-192.png..."
convert "$LOGO_PATH" -resize 192x192 -gravity center -background white -extent 192x192 "$OUTPUT_DIR/pwa-icon-192.png"

echo "📦 Génération de pwa-icon-512.png..."
convert "$LOGO_PATH" -resize 512x512 -gravity center -background white -extent 512x512 "$OUTPUT_DIR/pwa-icon-512.png"

echo "📦 Génération de icon-message.png..."
convert "$LOGO_PATH" -resize 96x96 -gravity center -background white -extent 96x96 "$OUTPUT_DIR/icon-message.png"

echo "📦 Génération de icon-mission.png..."
convert "$LOGO_PATH" -resize 96x96 -gravity center -background white -extent 96x96 "$OUTPUT_DIR/icon-mission.png"

echo "✅ Icônes PWA générées avec succès!"
ls -lh "$OUTPUT_DIR"/pwa-icon-* "$OUTPUT_DIR"/icon-*.png 2>/dev/null || echo "ℹ️  Vérifiez les icônes dans $OUTPUT_DIR"
