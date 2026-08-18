# 🔍 Vérification des Routes Serveur

## ❌ PROBLÈME IDENTIFIÉ

Le fichier `backend/server.js` **NE CONTIENT PAS** la route pour servir les fichiers statiques (logo, uploads, images, etc.).

### Ce qui manque:

```javascript
// Route pour servir les fichiers statiques - MANQUANT!
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// OU
app.use(express.static('public'));
```

---

## ✅ SOLUTION: Ajouter la Route Statique

### Option 1: Dans server.js (RECOMMANDÉ)

Ajoutez ces lignes APRÈS les middlewares CORS et AVANT les routes API (ligne ~132):

```javascript
// Servir les fichiers statiques (uploads, logo, etc.)
const uploadsPath = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use('/public', express.static(path.join(__dirname, 'public')));

console.log('📁 Fichiers statiques servis depuis:', uploadsPath);
```

### Option 2: Route Séparée

Créer un fichier `routes/staticRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const path = require('path');

// Servir le logo
router.get('/logo', (req, res) => {
  const logoPath = path.join(__dirname, '../public/uploads/logo.png');
  res.sendFile(logoPath);
});

module.exports = router;
```

Puis dans `server.js`:
```javascript
const staticRoutes = require('./routes/staticRoutes');
app.use('/api', staticRoutes);
```

---

## 📋 Commandes de Vérification sur le Serveur

### 1. Se connecter au serveur

```bash
ssh root@145.223.33.208
# Password: BelgiqueDreambis@272829
```

### 2. Vérifier la structure des fichiers

```bash
cd /var/www/vhosts/indebel.be/api.indebel.be

# Vérifier server.js
head -150 server.js | grep -A 5 "static\|public"

# Vérifier si le dossier public existe
ls -la public/ 2>/dev/null || echo "❌ Dossier public n'existe pas"

# Vérifier les uploads
ls -la public/uploads/ 2>/dev/null || echo "❌ Dossier uploads n'existe pas"

# Chercher le logo
find . -name "logo*" -type f 2>/dev/null
```

### 3. Vérifier les routes dans server.js

```bash
cd /var/www/vhosts/indebel.be/api.indebel.be
grep -n "express.static\|/uploads\|/public" server.js
```

**Attendu:** Devrait montrer une ligne avec `express.static`  
**Si vide:** La route manque!

### 4. Vérifier PM2 et les logs

```bash
pm2 status
pm2 logs indebel-api --lines 50
```

### 5. Tester les routes

```bash
# Tester la route racine
curl http://localhost:5000/

# Tester une route API
curl http://localhost:5000/api/secteurs

# Tester le logo (si la route existe)
curl -I http://localhost:5000/uploads/logo.png
```

---

## 🔧 CORRECTION À APPLIQUER

### Fichier à modifier: `backend/server.js`

**Position:** Après la ligne 132 (après `app.use(express.urlencoded...)`)

**Code à ajouter:**

```javascript
// ============================================
// Servir les fichiers statiques
// ============================================
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const publicDir = path.join(__dirname, 'public');

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('📁 Dossier public créé');
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé');
}

// Servir les fichiers statiques
app.use('/uploads', express.static(uploadsDir));
app.use('/public', express.static(publicDir));

console.log('✅ Fichiers statiques configurés:');
console.log('   - /uploads →', uploadsDir);
console.log('   - /public →', publicDir);
```

---

## 📝 Script de Correction Automatique

Créez ce script sur le serveur:

```bash
#!/bin/bash
cd /var/www/vhosts/indebel.be/api.indebel.be

# Créer les dossiers nécessaires
mkdir -p public/uploads
chmod 755 public
chmod 755 public/uploads

echo "✅ Dossiers créés"

# Backup du fichier
cp server.js server.js.backup

# Note: Il faut ajouter manuellement les lignes dans server.js
# car c'est une modification structurelle

echo "📝 Fichier server.js sauvegardé (server.js.backup)"
echo ""
echo "⚠️  Action requise: Ajoutez les routes statiques dans server.js"
echo "    Position: Après la ligne 132"
echo ""
echo "Puis redémarrez PM2:"
echo "pm2 restart indebel-api"
```

---

## 🧪 Tests à Effectuer Après Correction

### 1. Test de la route racine

```bash
curl http://localhost:5000/
```

**Attendu:** JSON avec message de bienvenue

### 2. Test d'une route API

```bash
curl http://localhost:5000/api/secteurs
```

**Attendu:** Liste des secteurs

### 3. Test des fichiers statiques

```bash
# Si un fichier existe dans public/uploads/
curl -I http://localhost:5000/uploads/test.jpg
```

**Attendu:** `200 OK` ou `404` si le fichier n'existe pas

### 4. Test depuis le frontend

```javascript
// Dans le frontend, tester:
const logoUrl = `${process.env.VITE_API_URL}/uploads/logo.png`;
```

---

## 📊 État Actuel vs État Attendu

### ❌ État Actuel (Problématique)

```javascript
// server.js - PAS de route statique
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes API directement
app.use('/api/auth', authRoutes);
```

**Problème:** Les fichiers dans `/public/uploads/` ne sont pas accessibles

### ✅ État Attendu (Corrigé)

```javascript
// server.js - AVEC route statique
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// AJOUT: Routes statiques
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api/auth', authRoutes);
```

**Résultat:** Les fichiers sont accessibles via `/uploads/fichier.ext`

---

## 🚀 Procédure de Déploiement de la Correction

### 1. Local: Modifier server.js

```bash
# Ajouter les routes statiques dans server.js local
nano backend/server.js
```

### 2. Transférer vers le serveur

```bash
scp backend/server.js root@145.223.33.208:/var/www/vhosts/indebel.be/api.indebel.be/
```

### 3. Sur le serveur: Créer les dossiers

```bash
ssh root@145.223.33.208
cd /var/www/vhosts/indebel.be/api.indebel.be
mkdir -p public/uploads
chmod 755 public public/uploads
```

### 4. Redémarrer PM2

```bash
pm2 restart indebel-api
pm2 logs indebel-api
```

### 5. Vérifier

```bash
curl -I http://localhost:5000/uploads/
pm2 logs indebel-api --lines 20
```

---

## ✅ Checklist de Vérification

- [ ] `server.js` contient `express.static`
- [ ] Dossier `/public` existe sur le serveur
- [ ] Dossier `/public/uploads` existe sur le serveur
- [ ] Permissions correctes (755)
- [ ] PM2 redémarré
- [ ] Pas d'erreurs dans les logs PM2
- [ ] Route `/uploads/` accessible
- [ ] Logo visible dans le frontend

---

## 🆘 Dépannage

### Problème 1: "Cannot GET /uploads/logo.png"

**Cause:** Route statique manquante  
**Solution:** Ajouter `app.use('/uploads', express.static(...))`

### Problème 2: "ENOENT: no such file or directory"

**Cause:** Dossier `public/uploads` n'existe pas  
**Solution:** 
```bash
mkdir -p /var/www/vhosts/indebel.be/api.indebel.be/public/uploads
```

### Problème 3: "403 Forbidden"

**Cause:** Permissions incorrectes  
**Solution:**
```bash
chmod 755 /var/www/vhosts/indebel.be/api.indebel.be/public
chmod 755 /var/www/vhosts/indebel.be/api.indebel.be/public/uploads
chmod 644 /var/www/vhosts/indebel.be/api.indebel.be/public/uploads/*
```

---

✅ **Cette vérification identifie le problème principal: l'absence de routes statiques dans server.js**
