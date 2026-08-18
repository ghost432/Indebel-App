# Corrections apportées au site de production

## Date: 31 octobre 2025

### Problèmes identifiés

1. **404 sur les images de badges** : `/src/images/2.png` et `/src/images/1.png`
2. **Erreur CORS** : Appels vers `https://api.indebel.be/api` au lieu de `https://pro.indebel.be/api`
3. **TypeError null style** : Causé par l'image manquante

### Corrections effectuées

#### 1. Chemins d'images corrigés

**Fichiers modifiés:**
- `frontend/src/components/VerificationBadge.jsx`
- `frontend/src/components/UserBadges.jsx`

**Changements:**
- `/src/images/2.png` → `/images/2.png`
- `/src/images/1.png` → `/images/1.png`

**Raison:** En production, après le build Vite, les images sont dans `/images/` et non `/src/images/`

#### 2. URL de l'API corrigée

**Fichier modifié:**
- `frontend/src/config.js`

**Changement:**
```javascript
// Avant
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.indebel.be/api';

// Après
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pro.indebel.be/api';
```

**Raison:** La valeur par défaut pointait vers l'ancienne URL. Même avec `.env.production` correct, si la variable n'est pas chargée, le fallback utilisait la mauvaise URL.

### Script de déploiement créé

**Fichier:** `deploy-frontend.sh`

**Fonctionnalités:**
1. Build automatique du frontend en mode production
2. Sauvegarde de l'ancien déploiement
3. Transfert des fichiers vers le serveur
4. Correction des permissions

**Usage:**
```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

**Note:** Le script nécessite le mot de passe SSH (ou configurez une clé SSH pour automatiser complètement)

### Déploiement manuel (alternative)

Si vous préférez déployer manuellement :

```bash
# 1. Build du frontend
cd frontend
npm run build:prod

# 2. Transfert vers le serveur
scp -r dist/* root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/

# 3. Correction des permissions
ssh root@145.223.33.208 "chown -R indebel.be_2onhxvmxsxu:psacln /var/www/vhosts/indebel.be/pro.indebel.be/* && chmod -R 755 /var/www/vhosts/indebel.be/pro.indebel.be"
```

### Vérification après déploiement

1. Accédez à https://pro.indebel.be
2. Ouvrez la console développeur (F12)
3. Vérifiez qu'il n'y a plus d'erreurs 404 pour les images
4. Vérifiez que les appels API vont vers `https://pro.indebel.be/api`
5. Vérifiez que les badges de vérification s'affichent correctement

### Configuration serveur (rappel)

**Frontend:** `/var/www/vhosts/indebel.be/pro.indebel.be/`
**Backend:** `/var/www/indebel/backend/` (port 5000, géré par PM2)

**Fichiers de configuration:**
- `frontend/.env.production` : `VITE_API_BASE_URL=https://pro.indebel.be/api`
- `backend/.env` : CORS configuré pour `https://pro.indebel.be`

### Améliorations futures recommandées

1. **Clé SSH** : Configurez une clé SSH pour automatiser complètement le déploiement
2. **CI/CD** : Mettez en place un pipeline CI/CD (GitHub Actions, GitLab CI)
3. **Monitoring** : Ajoutez un système de monitoring d'erreurs (Sentry, LogRocket)
4. **Cache busting** : Vérifiez que les fichiers JS/CSS ont des hash pour éviter les problèmes de cache

### Notes importantes

- Les images de badges (`1.png` et `2.png`) existent bien dans `/var/www/vhosts/indebel.be/pro.indebel.be/images/`
- Le backend CORS est configuré pour accepter `https://pro.indebel.be`
- Le routing SPA est configuré avec `FallbackResource /index.html` dans Apache
