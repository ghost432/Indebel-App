#!/bin/bash

echo "🔄 Remplacement des termes dans le backend..."
echo ""

# Répertoire backend
BACKEND_DIR="./backend"

# Fonction pour remplacer les termes
replace_terms() {
    echo "📝 Remplacement dans les fichiers .js..."
    
    # Trouver tous les fichiers .js (sauf node_modules)
    find "$BACKEND_DIR" -type f -name "*.js" ! -path "*/node_modules/*" | while read file; do
        # Sauvegarder le fichier original
        cp "$file" "$file.bak"
        
        # Remplacer les termes (en préservant la casse)
        sed -i "s/l'indépendant/le prestataire/g" "$file"
        sed -i "s/L'indépendant/Le prestataire/g" "$file"
        sed -i "s/l'Indépendant/le Prestataire/g" "$file"
        sed -i "s/L'Indépendant/Le Prestataire/g" "$file"
        
        sed -i "s/indépendant/prestataire/g" "$file"
        sed -i "s/Indépendant/Prestataire/g" "$file"
        sed -i "s/INDÉPENDANT/PRESTATAIRE/g" "$file"
        sed -i "s/Independant/Prestataire/g" "$file"
        
        sed -i "s/indépendants/prestataires/g" "$file"
        sed -i "s/Indépendants/Prestataires/g" "$file"
        sed -i "s/INDÉPENDANTS/PRESTATAIRES/g" "$file"
        
        sed -i "s/l'entreprise/le recruteur/g" "$file"
        sed -i "s/L'entreprise/Le recruteur/g" "$file"
        sed -i "s/l'Entreprise/le Recruteur/g" "$file"
        sed -i "s/L'Entreprise/Le Recruteur/g" "$file"
        
        sed -i "s/entreprise/recruteur/g" "$file"
        sed -i "s/Entreprise/Recruteur/g" "$file"
        sed -i "s/ENTREPRISE/RECRUTEUR/g" "$file"
        
        sed -i "s/entreprises/recruteurs/g" "$file"
        sed -i "s/Entreprises/Recruteurs/g" "$file"
        sed -i "s/ENTREPRISES/RECRUTEURS/g" "$file"
        
        # Vérifier si le fichier a changé
        if ! cmp -s "$file" "$file.bak"; then
            echo "  ✅ Modifié: $file"
        fi
        
        # Supprimer la sauvegarde
        rm "$file.bak"
    done
    
    echo ""
    echo "✅ Remplacement terminé dans le backend"
}

# Exécuter le remplacement
replace_terms

echo ""
echo "📋 Résumé des modifications :"
echo "   • 'indépendant' → 'prestataire'"
echo "   • 'Indépendant' → 'Prestataire'"
echo "   • 'indépendants' → 'prestataires'"
echo "   • 'entreprise' → 'recruteur'"
echo "   • 'Entreprise' → 'Recruteur'"
echo "   • 'entreprises' → 'recruteurs'"
echo ""
echo "🔄 Prochaines étapes :"
echo "   1. Vérifiez les modifications"
echo "   2. Déployez le backend"
echo "   3. pm2 restart indebel-api"
