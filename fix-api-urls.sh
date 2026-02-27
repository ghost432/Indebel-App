#!/bin/bash

# Script pour remplacer toutes les URLs hardcodées par API_BASE_URL

set -e

echo "🔧 Remplacement des URLs hardcodées..."

# Liste des fichiers à modifier
FILES=(
  "frontend/src/context/NotificationContext.jsx"
  "frontend/src/components/SecteurCompetenceSelector.jsx"
  "frontend/src/pages/FreelancerDashboard.jsx"
  "frontend/src/pages/PublishMissionFixed.jsx"
  "frontend/src/pages/AdminLangues.jsx"
  "frontend/src/pages/AdminPublishMission.jsx"
  "frontend/src/pages/PublishMissionHourly.jsx"
  "frontend/src/pages/AdminSendNotification.jsx"
  "frontend/src/pages/AdminSecteurs.jsx"
  "frontend/src/pages/EmployerDashboard.jsx"
  "frontend/src/pages/AdminCompetences.jsx"
  "frontend/src/pages/Notifications.jsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  📝 Modification de $file..."
    
    # Vérifier si le fichier contient déjà l'import
    if ! grep -q "import.*API_BASE_URL.*from.*config" "$file"; then
      # Ajouter l'import en haut du fichier après les autres imports
      sed -i "1a import { API_BASE_URL } from '../config'" "$file" 2>/dev/null || \
      sed -i "1a import { API_BASE_URL } from '../../config'" "$file" 2>/dev/null || \
      sed -i "1a import { API_BASE_URL } from '../../../config'" "$file"
    fi
    
    # Remplacer les URLs hardcodées
    sed -i "s|'https://api\.indebel\.be/api|\`\${API_BASE_URL}|g" "$file"
    sed -i "s|\"https://api\.indebel\.be/api|\`\${API_BASE_URL}|g" "$file"
    sed -i "s|\`https://api\.indebel\.be|\`\${API_BASE_URL}|g" "$file"
    
  else
    echo "  ⚠️  Fichier non trouvé: $file"
  fi
done

echo "✅ Remplacement terminé!"
echo ""
echo "📋 Fichiers modifiés: ${#FILES[@]}"
