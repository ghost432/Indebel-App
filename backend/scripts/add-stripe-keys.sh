#!/bin/bash

# Script pour ajouter les clés Stripe dans .env
# Date : 25 octobre 2025

echo "🔑 Configuration des clés Stripe..."
echo ""

# Chemin du fichier .env
ENV_FILE="../.env"

# Vérifier si le fichier .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Fichier .env introuvable !"
    echo "📁 Créer le fichier .env depuis .env.example..."
    cp ../.env.example "$ENV_FILE"
    echo "✅ Fichier .env créé"
fi

# Vérifier si les clés Stripe sont déjà présentes
if grep -q "STRIPE_SECRET_KEY" "$ENV_FILE"; then
    echo "ℹ️  Les clés Stripe sont déjà présentes dans .env"
    echo ""
    echo "📋 Configuration actuelle :"
    grep "STRIPE" "$ENV_FILE" | sed 's/\(=sk_[^=]*\).*/\1***/' | sed 's/\(=pk_[^=]*\).*/\1***/' | sed 's/\(=whsec_[^=]*\).*/\1***/'
    echo ""
    read -p "❓ Voulez-vous les remplacer ? (o/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo "✅ Configuration Stripe inchangée"
        exit 0
    fi
    
    # Supprimer les anciennes clés
    sed -i '/STRIPE_SECRET_KEY/d' "$ENV_FILE"
    sed -i '/STRIPE_PUBLISHABLE_KEY/d' "$ENV_FILE"
    sed -i '/STRIPE_WEBHOOK_SECRET/d' "$ENV_FILE"
    sed -i '/STRIPE CONFIGURATION/d' "$ENV_FILE"
fi

# Ajouter les nouvelles clés
echo "" >> "$ENV_FILE"
echo "# ===== STRIPE CONFIGURATION =====" >> "$ENV_FILE"
echo "STRIPE_SECRET_KEY=sk_live_votre_cle_secrete_ici" >> "$ENV_FILE"
echo "STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique_ici" >> "$ENV_FILE"
echo "STRIPE_WEBHOOK_SECRET=whsec_TEMPORAIRE_A_CONFIGURER" >> "$ENV_FILE"

echo "✅ Clés Stripe ajoutées avec succès !"
echo ""
echo "📋 Nouvelles clés ajoutées :"
grep "STRIPE" "$ENV_FILE" | sed 's/\(=sk_live_[^=]*\).*/\1***/' | sed 's/\(=pk_live_[^=]*\).*/\1***/' | sed 's/\(=whsec_[^=]*\).*/\1***/'
echo ""
echo "⚠️  IMPORTANT : Configuration du Webhook"
echo "Le STRIPE_WEBHOOK_SECRET est temporaire. Pour le configurer :"
echo ""
echo "En développement (local) :"
echo "  1. Installer Stripe CLI : brew install stripe/stripe-cli/stripe"
echo "  2. Se connecter : stripe login"
echo "  3. Écouter : stripe listen --forward-to localhost:5000/api/paiement/webhook"
echo "  4. Copier le webhook secret affiché"
echo ""
echo "En production :"
echo "  1. Aller sur : https://dashboard.stripe.com/webhooks"
echo "  2. Créer un endpoint avec votre URL"
echo "  3. Copier le webhook secret"
echo ""
echo "🔄 Le serveur devrait redémarrer automatiquement (nodemon)"
echo ""
