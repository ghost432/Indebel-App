# 🚀 Déploiement Indebel - Procédure Complète

**Serveur:** 145.223.33.208 (Plesk)  
**Frontend:** https://pro.indebel.be  
**API:** https://api.indebel.be

---

## ✅ Configuration Actuelle

Tout est déjà configuré:
- ✅ Base de données: `indebel_bd` / `indebel_user` / `indebel_pass`
- ✅ Stripe LIVE configuré
- ✅ Email Hostinger configuré
- ✅ JWT Secret configuré

---

## 🚀 Déploiement Automatique (RECOMMANDÉ)

### Utiliser le script automatique

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

Le script fait automatiquement:
1. ✅ Build du frontend
2. ✅ Transfert des fichiers
3. ✅ Installation des dépendances backend
4. ✅ Configuration PM2
5. ✅ Démarrage de l'API

---

## 📝 Déploiement Manuel (Alternative)

Si vous préférez faire étape par étape:

### Étape 1: Build du Frontend

```bash
cd frontend
npm install
npm run build
```

### Étape 2: Transférer le Frontend

```bash
# Option A: Avec rsync (plus rapide)
rsync -avz --delete frontend/dist/ root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/

# Option B: Avec scp
scp -r frontend/dist/* root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/
```

### Étape 3: Créer .htaccess pour le Frontend

```bash
ssh root@145.223.33.208

cat > /var/www/vhosts/indebel.be/pro.indebel.be/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
```

### Étape 4: Transférer le Backend

```bash
# Créer une archive (excluant node_modules)
cd backend
tar --exclude='node_modules' --exclude='.git' -czf ../backend.tar.gz .
cd ..

# Transférer l'archive
scp backend.tar.gz root@145.223.33.208:/tmp/

# Extraire sur le serveur
ssh root@145.223.33.208 << 'EOF'
cd /var/www/vhosts/indebel.be/api.indebel.be
tar -xzf /tmp/backend.tar.gz
rm /tmp/backend.tar.gz
EOF
```

### Étape 5: Copier le fichier .env

```bash
scp backend/.env.production root@145.223.33.208:/var/www/vhosts/indebel.be/api.indebel.be/.env
```

### Étape 6: Installer les Dépendances Backend

```bash
ssh root@145.223.33.208 << 'EOF'
cd /var/www/vhosts/indebel.be/api.indebel.be
npm install --production
EOF
```

### Étape 7: Créer le Fichier ecosystem.config.js pour PM2

```bash
ssh root@145.223.33.208 << 'EOF'
cat > /var/www/vhosts/indebel.be/api.indebel.be/ecosystem.config.js << 'EOFINNER'
module.exports = {
  apps: [{
    name: 'indebel-api',
    script: 'server.js',
    cwd: '/var/www/vhosts/indebel.be/api.indebel.be',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/www/vhosts/indebel.be/api.indebel.be/logs/pm2-error.log',
    out_file: '/var/www/vhosts/indebel.be/api.indebel.be/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10
  }]
};
EOFINNER
EOF
```

### Étape 8: Créer le Dossier Logs

```bash
ssh root@145.223.33.208 << 'EOF'
mkdir -p /var/www/vhosts/indebel.be/api.indebel.be/logs
chown -R www-data:www-data /var/www/vhosts/indebel.be/api.indebel.be/logs
EOF
```

### Étape 9: Démarrer l'API avec PM2

```bash
ssh root@145.223.33.208 << 'EOF'
cd /var/www/vhosts/indebel.be/api.indebel.be

# Arrêter l'ancienne instance si elle existe
pm2 delete indebel-api 2>/dev/null || true

# Démarrer avec la nouvelle configuration
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup systemd -u root --hp /root
EOF
```

### Étape 10: Importer la Base de Données (Si nécessaire)

Si c'est la première fois ou si vous avez une nouvelle structure:

```bash
# Via SSH
ssh root@145.223.33.208
mysql -u indebel_user -p'indebel_pass' indebel_bd < /tmp/database.sql

# Ou via phpMyAdmin dans Plesk:
# https://145.223.33.208:8443
# Base: indebel_bd
# User: indebel_user
# Pass: indebel_pass
```

---

## ✅ Vérifications Post-Déploiement

### 1. Vérifier le Frontend

```bash
curl -I https://pro.indebel.be
# Doit retourner: 200 OK
```

**Dans le navigateur:**
- Ouvrir https://pro.indebel.be
- Vérifier qu'il n'y a pas d'erreurs console (F12)
- Tester l'inscription/connexion

### 2. Vérifier l'API

```bash
curl https://api.indebel.be
# Doit retourner une réponse JSON
```

### 3. Vérifier PM2

```bash
ssh root@145.223.33.208 "pm2 status"
# indebel-api doit être "online"

ssh root@145.223.33.208 "pm2 logs indebel-api --lines 50"
# Vérifier qu'il n'y a pas d'erreurs
```

### 4. Vérifier la Base de Données

```bash
ssh root@145.223.33.208
mysql -u indebel_user -p'indebel_pass' indebel_bd -e "SHOW TABLES;"
```

---

## 🔄 Mise à Jour Rapide

Pour les déploiements suivants:

### Frontend uniquement

```bash
cd frontend
npm run build
rsync -avz --delete frontend/dist/ root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/
```

### Backend uniquement

```bash
cd backend
tar --exclude='node_modules' -czf ../backend.tar.gz .
scp ../backend.tar.gz root@145.223.33.208:/tmp/
ssh root@145.223.33.208 << 'EOF'
cd /var/www/vhosts/indebel.be/api.indebel.be
tar -xzf /tmp/backend.tar.gz
npm install --production
pm2 restart indebel-api
EOF
```

### .env uniquement

```bash
scp backend/.env.production root@145.223.33.208:/var/www/vhosts/indebel.be/api.indebel.be/.env
ssh root@145.223.33.208 "pm2 restart indebel-api"
```

---

## 🆘 Commandes Utiles

### PM2

```bash
# Voir le statut
ssh root@145.223.33.208 "pm2 status"

# Voir les logs en temps réel
ssh root@145.223.33.208 "pm2 logs indebel-api"

# Redémarrer
ssh root@145.223.33.208 "pm2 restart indebel-api"

# Arrêter
ssh root@145.223.33.208 "pm2 stop indebel-api"

# Monitoring
ssh root@145.223.33.208 "pm2 monit"
```

### Base de Données

```bash
# Connexion
ssh root@145.223.33.208
mysql -u indebel_user -p'indebel_pass' indebel_bd

# Backup
ssh root@145.223.33.208 "mysqldump -u indebel_user -p'indebel_pass' indebel_bd > /tmp/backup_$(date +%Y%m%d).sql"
```

### Logs

```bash
# Logs PM2
ssh root@145.223.33.208 "tail -f /var/www/vhosts/indebel.be/api.indebel.be/logs/pm2-error.log"

# Logs Apache/Nginx
ssh root@145.223.33.208 "tail -f /var/log/nginx/error.log"
```

---

## 🚨 Dépannage

### Frontend page blanche

```bash
# Vérifier les fichiers
ssh root@145.223.33.208 "ls -la /var/www/vhosts/indebel.be/pro.indebel.be/"

# Vérifier .htaccess
ssh root@145.223.33.208 "cat /var/www/vhosts/indebel.be/pro.indebel.be/.htaccess"

# Redéployer
cd frontend && npm run build
rsync -avz --delete dist/ root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/
```

### API ne répond pas (502)

```bash
# Vérifier PM2
ssh root@145.223.33.208 "pm2 status"

# Voir les logs
ssh root@145.223.33.208 "pm2 logs indebel-api --lines 100"

# Redémarrer
ssh root@145.223.33.208 "pm2 restart indebel-api"
```

### Erreur Base de Données

```bash
# Vérifier la connexion
ssh root@145.223.33.208
mysql -u indebel_user -p'indebel_pass' indebel_bd

# Vérifier le .env
ssh root@145.223.33.208 "cat /var/www/vhosts/indebel.be/api.indebel.be/.env | grep DB_"
```

### Erreur CORS

```bash
# Vérifier CORS_ORIGINS dans .env
ssh root@145.223.33.208 "cat /var/www/vhosts/indebel.be/api.indebel.be/.env | grep CORS"

# Doit contenir: https://pro.indebel.be
# Redémarrer après modification
ssh root@145.223.33.208 "pm2 restart indebel-api"
```

---

## 📊 URLs de Production

- **Frontend:** https://pro.indebel.be
- **API:** https://api.indebel.be
- **Admin:** https://pro.indebel.be/admin
- **Plesk:** https://145.223.33.208:8443

---

## ✅ Checklist Finale

- [ ] Frontend accessible (https://pro.indebel.be)
- [ ] API répond (https://api.indebel.be)
- [ ] Inscription/Connexion fonctionne
- [ ] Pas d'erreurs console (F12)
- [ ] PM2 status = "online"
- [ ] Pas d'erreurs dans les logs PM2
- [ ] Base de données accessible
- [ ] Paiements Stripe fonctionnent (mode test d'abord!)
- [ ] Emails envoyés correctement

---

🎉 **Déploiement Terminé!**
