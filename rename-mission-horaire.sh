#!/bin/bash

echo "🔄 Remplacement de 'Mission horaire' par 'Mission Taux horaire'..."
echo ""

# Fonction pour remplacer les termes
replace_terms() {
    echo "📝 Remplacement dans le frontend..."
    
    # Frontend
    find "./frontend/src" -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) | while read file; do
        cp "$file" "$file.bak"
        
        sed -i "s/Mission horaire/Mission Taux horaire/g" "$file"
        sed -i "s/mission horaire/mission taux horaire/g" "$file"
        sed -i "s/MISSION HORAIRE/MISSION TAUX HORAIRE/g" "$file"
        sed -i "s/Missions horaires/Missions Taux horaire/g" "$file"
        sed -i "s/missions horaires/missions taux horaire/g" "$file"
        
        if ! cmp -s "$file" "$file.bak"; then
            echo "  ✅ Modifié: $file"
        fi
        
        rm "$file.bak"
    done
    
    echo ""
    echo "📝 Remplacement dans le backend..."
    
    # Backend
    find "./backend" -type f -name "*.js" ! -path "*/node_modules/*" | while read file; do
        cp "$file" "$file.bak"
        
        sed -i "s/Mission horaire/Mission Taux horaire/g" "$file"
        sed -i "s/mission horaire/mission taux horaire/g" "$file"
        sed -i "s/MISSION HORAIRE/MISSION TAUX HORAIRE/g" "$file"
        sed -i "s/Missions horaires/Missions Taux horaire/g" "$file"
        sed -i "s/missions horaires/missions taux horaire/g" "$file"
        
        if ! cmp -s "$file" "$file.bak"; then
            echo "  ✅ Modifié: $file"
        fi
        
        rm "$file.bak"
    done
    
    echo ""
    echo "✅ Remplacement terminé"
}

# Exécuter le remplacement
replace_terms

echo ""
echo "📋 Résumé :"
echo "   • 'Mission horaire' → 'Mission Taux horaire'"
echo "   • 'mission horaire' → 'mission taux horaire'"
echo "   • 'Missions horaires' → 'Missions Taux horaire'"
