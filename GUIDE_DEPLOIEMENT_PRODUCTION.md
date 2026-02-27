# 🚀 Guide de Déploiement Production - Indebel

**Date:** 30 Novembre 2025  
**Serveur:** 145.223.33.208  
**Frontend:** https://pro.indebel.be  
**API:** https://api.indebel.be

---

## 📋 Pré-requis

Avant de commencer le déploiement, assurez-vous d'avoir:

- ✅ Accès SSH au serveur (root@145.223.33.208)
- ✅ Les identifiants de connexion (BelgiqueDreambis@272829)
- ✅ Node.js et npm installés localement
- ✅ Connexion internet stable
- ✅ Environ 30 minutes de temps disponible

---

## 🎯 Ce qui va être déployé

### Nouvelles Fonctionnalités

1. **Système de Support Complet**
   - Tables: `support_tickets`, `support_responses`
   - Pages utilisateur et admin
   - Notifications en temps réel
   - Interface de chat

2. **Réinitialisation de Mot de Passe**
   - Colonnes: `reset_password_token`, `reset_password_expires`
   - Templates email professionnels
   - Système de tokens sécurisé

3. **Améliorations Backend**
   - Nouvelles routes API
   - Contrôleurs optimisés
   - Middleware de sécurité

4. **Améliorations Frontend**
   - Nouveaux composants React
   - Interface utilisateur moderne
   - Gestion d'état optimisée

---

## 🚀 Méthode 1: Déploiement Automatique (RECOMMANDÉ)

### Étape 1: Préparer le déploiement

```bash
cd /home/thierry-ninja/Desktop/windsurf-project-3/indebel
```

### Étape 2: Lancer le script de déploiement

```bash
./deploy-production-complete.sh
```

Le script va automatiquement:
1. ✅ Créer un backup de la base de données
2. ✅ Builder le frontend
3. ✅ Transférer les fichiers
4. ✅ Mettre à jour la base de données
5. ✅ Redémarrer l'API
6. ✅ Vérifier les services

### Étape 3: Vérifier le déploiement

```bash
./verify-production.sh
```

---

## 🔧 Méthode 2: Déploiement Manuel

Si vous préférez contrôler chaque étape:

### 1. Backup de la Base de Données

```bash
ssh root@145.223.33.208
mysqldump -u indebel_user -p'indebel_pass' indebel_bd > /tmp/backup_$(date +%Y%m%d).sql
exit
```

### 2. Build du Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Transfert Frontend

```bash
rsync -avz --delete frontend/dist/ root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/
```

### 4. Transfert Backend

```bash
cd backend
tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf ../backend.tar.gz .
cd ..
scp backend.tar.gz root@145.223.33.208:/tmp/

ssh root@145.223.33.208 << 'EOF'
cd /var/www/vhosts/indebel.be/api.indebel.be
tar -xzf /tmp/backend.tar.gz
rm /tmp/backend.tar.gz
npm install --production
EOF
```

### 5. Configuration .env

```bash
scp backend/.env.production root@145.223.33.208:/var/www/vhosts/indebel.be/api.indebel.be/.env
```

### 6. Mise à Jour Base de Données

```bash
scp migration_production_complete.sql root@145.223.33.208:/tmp/

ssh root@145.223.33.208 << 'EOF'
mysql -u indebel_user -p'indebel_pass' indebel_bd < /tmp/migration_production_complete.sql
rm /tmp/migration_production_complete.sql
EOF
```

### 7. Redémarrage PM2

```bash
ssh root@145.223.33.208 << 'EOF'
cd /var/www/vhosts/indebel.be/api.indebel.be
pm2 delete indebel-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
EOF
```

---

## ✅ Vérifications Post-Déploiement

### Vérifier le Frontend

```bash
curl -I https://pro.indebel.be
# Doit retourner: 200 OK
```

Ouvrir dans le navigateur:
- https://pro.indebel.be
- Vérifier la console (F12) pour les erreurs
- Tester login/inscription

### Vérifier l'API

```bash
curl https://api.indebel.be
# Doit retourner une réponse JSON

ssh root@145.223.33.208 "pm2 status"
# indebel-api doit être "online"
```

### Vérifier les Nouvelles Fonctionnalités

1. **Support System**
   - ✅ Créer un ticket depuis l'interface utilisateur
   - ✅ Vérifier qu'il apparaît dans l'admin
   - ✅ Ajouter une réponse
   - ✅ Vérifier la notification

2. **Reset Password**
   - ✅ Aller sur "Mot de passe oublié"
   - ✅ Entrer un email
   - ✅ Vérifier la réception de l'email
   - ✅ Cliquer sur le lien
   - ✅ Réinitialiser le mot de passe
   - ✅ Se connecter avec le nouveau mot de passe

### Vérifier les Logs

```bash
ssh root@145.223.33.208 "pm2 logs indebel-api --lines 50"
```

Rechercher:
- ❌ Pas d'erreurs rouges
- ✅ "Server running on port 5000"
- ✅ "Database connected successfully"

---

## 🆘 Dépannage

### Frontend Page Blanche

```bash
ssh root@145.223.33.208
cd /var/www/vhosts/indebel.be/pro.indebel.be
ls -la

# Vérifier que index.html existe
# Si non, redéployer le frontend
```

### API Erreur 502

```bash
ssh root@145.223.33.208
pm2 logs indebel-api --err

# Erreurs communes:
# - Database connection failed -> Vérifier .env
# - Port already in use -> Redémarrer PM2
# - Module not found -> npm install
```

### Base de Données

```bash
ssh root@145.223.33.208
mysql -u indebel_user -p'indebel_pass' indebel_bd

# Vérifier les tables
SHOW TABLES;

# Doit inclure:
# - support_tickets
# - support_responses

# Vérifier les colonnes users
DESCRIBE users;

# Doit inclure:
# - reset_password_token
# - reset_password_expires
```

### Restaurer un Backup

Si quelque chose ne va pas:

```bash
ssh root@145.223.33.208
mysql -u indebel_user -p'indebel_pass' indebel_bd < /tmp/backup_YYYYMMDD.sql
pm2 restart indebel-api
```

---

## 📊 Structure des Fichiers

### Serveur Production

```
/var/www/vhosts/indebel.be/
├── pro.indebel.be/           # Frontend
│   ├── index.html
│   ├── assets/
│   └── .htaccess
│
└── api.indebel.be/           # Backend
    ├── server.js
    ├── .env
    ├── ecosystem.config.js
    ├── node_modules/
    ├── controllers/
    ├── routes/
    ├── models/
    ├── middleware/
    ├── migrations/
    └── logs/
```

### Base de Données

```
indebel_bd
├── users
├── missions
├── forfaits
├── applications
├── notifications
├── support_tickets          ⭐ NOUVEAU
├── support_responses         ⭐ NOUVEAU
└── ... autres tables
```

---

## 🔄 Mises à Jour Futures

Pour les prochains déploiements:

### Frontend uniquement

```bash
cd frontend
npm run build
rsync -avz --delete dist/ root@145.223.33.208:/var/www/vhosts/indebel.be/pro.indebel.be/
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

### Nouvelle Migration DB

```bash
scp nouvelle_migration.sql root@145.223.33.208:/tmp/
ssh root@145.223.33.208 "mysql -u indebel_user -p'indebel_pass' indebel_bd < /tmp/nouvelle_migration.sql"
ssh root@145.223.33.208 "pm2 restart indebel-api"
```

---

## 🛡️ Sécurité

### Bonnes Pratiques

- ✅ Toujours créer un backup avant déploiement
- ✅ Tester en local avant production
- ✅ Vérifier les logs après déploiement
- ✅ Ne jamais commiter les fichiers .env
- ✅ Utiliser des clés SSH au lieu de mots de passe
- ✅ Mettre à jour Node.js et les dépendances régulièrement

### Variables Sensibles

Les informations suivantes sont configurées dans `.env.production`:

- JWT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- EMAIL_PASSWORD
- DB_PASSWORD

⚠️ **Ne jamais partager ces informations**

---

## 📞 Support

### Logs Utiles

```bash
# Logs PM2
ssh root@145.223.33.208 "pm2 logs indebel-api"

# Logs Apache/Nginx
ssh root@145.223.33.208 "tail -f /var/log/nginx/error.log"

# Logs MySQL
ssh root@145.223.33.208 "tail -f /var/log/mysql/error.log"
```

### Commandes Rapides

```bash
# Redémarrer l'API
ssh root@145.223.33.208 "pm2 restart indebel-api"

# Voir le status
ssh root@145.223.33.208 "pm2 status"

# Monitoring en temps réel
ssh root@145.223.33.208 "pm2 monit"

# Vider les logs
ssh root@145.223.33.208 "pm2 flush indebel-api"
```

---

## ✅ Checklist Finale

Avant de considérer le déploiement terminé:

- [ ] Frontend accessible (https://pro.indebel.be)
- [ ] API répond (https://api.indebel.be)
- [ ] PM2 status = "online"
- [ ] Aucune erreur dans les logs
- [ ] Login/Inscription fonctionne
- [ ] Système de support opérationnel
- [ ] Reset password fonctionne
- [ ] Emails envoyés correctement
- [ ] Paiements Stripe fonctionnent
- [ ] Toutes les routes testées
- [ ] Base de données à jour
- [ ] Backup créé et sécurisé

---

## 🎉 Conclusion

Si toutes les vérifications sont ✅, félicitations ! 

**L'application Indebel est maintenant déployée en production avec toutes les nouvelles fonctionnalités.**

Pour toute question ou problème, référez-vous à ce guide ou consultez les fichiers de documentation dans le dossier du projet.

---

**Dernière mise à jour:** 30 Novembre 2025  
**Version:** 2.0  
**Statut:** ✅ Production Ready
