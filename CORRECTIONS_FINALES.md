# Corrections finales - Erreurs production pro.indebel.be

## Date: 31 octobre 2025

## ✅ Corrections effectuées

### 1. Chemins d'images corrigés (2 fichiers)
- ✅ `frontend/src/components/VerificationBadge.jsx`
- ✅ `frontend/src/components/UserBadges.jsx`

**Changement**: `/src/images/` → `/images/`

### 2. URLs API hardcodées remplacées (12 fichiers)

Tous les fichiers suivants ont été modifiés pour utiliser `API_BASE_URL` depuis `config.js` au lieu de URLs hardcodées:

1. ✅ `frontend/src/config.js` - URL par défaut corrigée
2. ✅ `frontend/src/context/NotificationContext.jsx` - 4 URLs corrigées
3. ✅ `frontend/src/components/SecteurCompetenceSelector.jsx` - 1 URL corrigée
4. ✅ `frontend/src/pages/FreelancerDashboard.jsx` - 1 URL corrigée  
5. ✅ `frontend/src/pages/EmployerDashboard.jsx` - 1 URL corrigée
6. ✅ `frontend/src/pages/PublishMissionFixed.jsx` - 1 URL corrigée
7. ✅ `frontend/src/pages/PublishMissionHourly.jsx` - 1 URL corrigée
8. ✅ `frontend/src/pages/AdminSecteurs.jsx` - 7 URLs corrigées
9. ✅ `frontend/src/pages/AdminLangues.jsx` - 4 URLs corrigées
10. ✅ `frontend/src/pages/AdminCompetences.jsx` - 4 URLs corrigées
11. ✅ `frontend/src/pages/AdminPublishMission.jsx` - 1 URL corrigée
12. ✅ `frontend/src/pages/AdminSendNotification.jsx` - 2 URLs corrigées
13. ✅ `frontend/src/pages/Notifications.jsx` - 5 URLs corrigées

**Total**: 32 URLs hardcodées remplacées

### 3. Configuration finale

**frontend/src/config.js**:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pro.indebel.be/api';
```

**frontend/.env.production**:
```
VITE_API_BASE_URL=https://pro.indebel.be/api
```

## 🚀 Déploiement

### Méthode automatique (recommandée)

Exécutez le script automatisé:

```bash
cd /home/thierry-ninja/CascadeProjects/windsurf-project-3/indebel
./deploy-frontend-auto.sh
```

Ce script va:
1. ✅ Utiliser le build existant dans `frontend/dist/`
2. ✅ Sauvegarder l'ancien déploiement
3. ✅ Transférer les fichiers vers le serveur
4. ✅ Corriger les permissions

### Méthode manuelle

Si vous préférez déployer manuellement:

```bash
# 1. Build du frontend
cd frontend
npm run build:prod

# 2. Transfert vers le serveur
cd ..
sshpass -p "BelgiqueDreambis@272829" scp -o StrictHostKeyChecking=no -r frontend/dist/* root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/

# 3. Correction des permissions
sshpass -p "BelgiqueDreambis@272829" ssh -o StrictHostKeyChecking=no root@145.223.33.208 "chown -R indebel.be_2onhxvmxsxu:psacln /var/www/vhosts/indebel.be/pro.indebel.be/* && chmod -R 755 /var/www/vhosts/indebel.be/pro.indebel.be"
```

### Alternative sans sshpass

Si vous n'avez pas `sshpass`, utilisez les commandes SSH normales (mot de passe demandé):

```bash
# Build
cd frontend && npm run build:prod && cd ..

# Transfert
scp -r frontend/dist/* root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/

# Permissions
ssh root@145.223.33.208 "chown -R indebel.be_2onhxvmxsxu:psacln /var/www/vhosts/indebel.be/pro.indebel.be/* && chmod -R 755 /var/www/vhosts/indebel.be/pro.indebel.be"
```

## 🧪 Vérifications après déploiement

1. **Accédez à** https://pro.indebel.be
2. **Ouvrez la console** (F12 → Console)
3. **Vérifiez**:
   - ✅ Aucune erreur 404 pour `/src/images/2.png` ou `/src/images/1.png`
   - ✅ Aucune erreur CORS pour `api.indebel.be`
   - ✅ Tous les appels API vont vers `https://pro.indebel.be/api`
   - ✅ Les badges de vérification s'affichent correctement

4. **Testez les fonctionnalités**:
   - Connexion
   - Notifications
   - Dashboard
   - Publications de missions (si employer/admin)

## 📊 Résumé des changements

| Type de correction | Nombre de fichiers | Nombre de modifications |
|-------------------|-------------------|------------------------|
| Chemins d'images | 2 | 4 imports corrigés |
| URLs API hardcodées | 12 | 32 URLs remplacées |
| Configuration | 1 | 1 URL par défaut |
| **TOTAL** | **15** | **37 corrections** |

## 🔍 Problèmes résolus

1. **404 Not Found** `/src/images/2.png` ❌ → ✅ `/images/2.png`
2. **CORS Error** `api.indebel.be` ❌ → ✅ `pro.indebel.be/api`
3. **TypeError null style** ❌ → ✅ (résolu par correction #1)

## 📝 Notes importantes

- Toutes les URLs hardcodées ont été remplacées par `API_BASE_URL`
- Le fichier `.env.production` est correct: `VITE_API_BASE_URL=https://pro.indebel.be/api`
- Le backend CORS accepte `https://pro.indebel.be`
- Les images existent bien dans `/var/www/vhosts/indebel.be/pro.indebel.be/images/`

## 🎯 Prochaines étapes recommandées

1. **Déployer** avec le script automatisé
2. **Tester** toutes les fonctionnalités
3. **Vérifier** la console pour s'assurer qu'il n'y a plus d'erreurs
4. **Configurer** une clé SSH pour automatiser complètement les futurs déploiements
5. **Mettre en place** un pipeline CI/CD (optionnel)
