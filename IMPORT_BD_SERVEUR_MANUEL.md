# 📤 Import Base de Données Local → Serveur

**Local:** root / root / indebel_bd  
**Serveur:** 145.223.33.208  
**Serveur DB:** indebel_user / indebel_pass / indebel_bd

---

## ✅ Étape 1: Export BD Locale (FAIT)

Le fichier est déjà créé: `/tmp/indebel_bd_export_for_server.sql` (1.5 MB)

---

## 📤 Étape 2: Transférer le Fichier au Serveur

### Option A: Avec mot de passe (recommandé)

```bash
scp /tmp/indebel_bd_export_for_server.sql root@145.223.33.208:/tmp/
```

**Mot de passe serveur:** `BelgiqueDreambis@272829`

### Option B: Copier le contenu manuellement

```bash
# 1. Afficher le contenu
cat /tmp/indebel_bd_export_for_server.sql

# 2. Sur le serveur, créer le fichier
ssh root@145.223.33.208
nano /tmp/indebel_import.sql
# Coller le contenu, Ctrl+X pour sauver
```

---

## 💾 Étape 3: Import sur le Serveur

Connectez-vous au serveur:

```bash
ssh root@145.223.33.208
# Password: BelgiqueDreambis@272829
```

Une fois connecté, exécutez ces commandes:

### 3.1: Vérifier que le fichier est bien transféré

```bash
ls -lh /tmp/indebel_bd_export_for_server.sql
```

**Attendu:** Fichier de ~1.5M

### 3.2: Se connecter à MySQL (avec mot de passe root de Plesk)

```bash
# Si vous connaissez le mot de passe root MySQL:
mysql -u root -p

# OU via Plesk (sans mot de passe):
mysql
```

### 3.3: Créer la base et l'utilisateur

Dans MySQL, exécutez:

```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS indebel_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur
CREATE USER IF NOT EXISTS 'indebel_user'@'localhost' IDENTIFIED BY 'indebel_pass';
CREATE USER IF NOT EXISTS 'indebel_user'@'%' IDENTIFIED BY 'indebel_pass';
CREATE USER IF NOT EXISTS 'indebel_user'@'127.0.0.1' IDENTIFIED BY 'indebel_pass';

-- Donner les permissions
GRANT ALL PRIVILEGES ON indebel_bd.* TO 'indebel_user'@'localhost';
GRANT ALL PRIVILEGES ON indebel_bd.* TO 'indebel_user'@'%';
GRANT ALL PRIVILEGES ON indebel_bd.* TO 'indebel_user'@'127.0.0.1';

-- Appliquer
FLUSH PRIVILEGES;

-- Quitter MySQL
EXIT;
```

### 3.4: Importer les données

```bash
# Importer avec l'utilisateur indebel_user
mysql -u indebel_user -p'indebel_pass' indebel_bd < /tmp/indebel_bd_export_for_server.sql
```

**OU si vous avez le mot de passe root MySQL:**

```bash
mysql -u root -p indebel_bd < /tmp/indebel_bd_export_for_server.sql
# Entrez le mot de passe root MySQL
```

---

## ✅ Étape 4: Vérification

### 4.1: Vérifier les tables

```bash
mysql -u indebel_user -p'indebel_pass' indebel_bd -e "SHOW TABLES;"
```

**Attendu:** Liste de 18 tables

### 4.2: Vérifier les données

```bash
mysql -u indebel_user -p'indebel_pass' indebel_bd -e "
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL SELECT 'competences', COUNT(*) FROM competences
UNION ALL SELECT 'applications', COUNT(*) FROM applications
UNION ALL SELECT 'messages', COUNT(*) FROM messages;
"
```

**Attendu:**
- users: 4
- competences: 59
- applications: 5
- messages: 11

### 4.3: Test de connexion

```bash
mysql -u indebel_user -p'indebel_pass' indebel_bd -e "SELECT 'Connexion OK!' AS status;"
```

**Attendu:** Affiche "Connexion OK!"

---

## 🆘 Dépannage

### Problème 1: "Access denied for user 'root'@'localhost'"

**Solution:** Utilisez le mot de passe root MySQL de Plesk, ou créez l'utilisateur via phpMyAdmin.

**Via phpMyAdmin:**
1. Ouvrir https://145.223.33.208:8443
2. Databases → phpMyAdmin
3. Onglet "User accounts"
4. Add user account:
   - User name: `indebel_user`
   - Host name: `%` (ou `localhost`)
   - Password: `indebel_pass`
   - Check "Grant all privileges on database indebel_bd"

### Problème 2: "Database does not exist"

```bash
mysql -u root -p -e "CREATE DATABASE indebel_bd;"
```

### Problème 3: Le fichier SQL n'est pas sur le serveur

Retransférez:
```bash
scp /tmp/indebel_bd_export_for_server.sql root@145.223.33.208:/tmp/
```

---

## 📋 Alternative: Import via phpMyAdmin (Plus Simple!)

### Étape 1: Préparer le fichier

Le fichier `/tmp/indebel_bd_export_for_server.sql` est prêt.

### Étape 2: Via phpMyAdmin

1. **Ouvrir phpMyAdmin:** https://145.223.33.208:8443
2. **Connexion Plesk** (credentials admin)
3. **Databases** → **phpMyAdmin**
4. **Sélectionner** la base `indebel_bd` (créer si n'existe pas)
5. **Onglet "Import"**
6. **Choose File** → Sélectionner `/tmp/indebel_bd_export_for_server.sql`
7. **Cliquer "Go"**

### Étape 3: Créer l'utilisateur dans phpMyAdmin

1. **Onglet "User accounts"**
2. **Add user account**
3. **User name:** `indebel_user`
4. **Host:** `%` (tous les hosts)
5. **Password:** `indebel_pass`
6. **Database for user account:** Check "Grant all privileges on database indebel_bd"
7. **Go**

---

## ✅ Configuration Backend (Déjà Fait)

Le fichier `backend/.env` sur le serveur doit contenir:

```env
DB_HOST=localhost
DB_USER=indebel_user
DB_PASSWORD=indebel_pass
DB_NAME=indebel_bd
DB_PORT=3306
```

---

## 🧪 Test Final

Sur le serveur:

```bash
cd /var/www/vhosts/indebel.be/api.indebel.be/

# Test de connexion Node.js
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM users');
  console.log('✅ Connexion OK! Users:', rows[0].count);
  await conn.end();
}

test();
"
```

---

## 📊 Résumé des Commandes Rapides

```bash
# 1. Transférer le fichier
scp /tmp/indebel_bd_export_for_server.sql root@145.223.33.208:/tmp/

# 2. Se connecter au serveur
ssh root@145.223.33.208

# 3. Créer la base (si nécessaire)
mysql -e "CREATE DATABASE IF NOT EXISTS indebel_bd;"

# 4. Importer
mysql indebel_bd < /tmp/indebel_bd_export_for_server.sql

# 5. Créer l'utilisateur
mysql << 'EOF'
CREATE USER IF NOT EXISTS 'indebel_user'@'%' IDENTIFIED BY 'indebel_pass';
GRANT ALL PRIVILEGES ON indebel_bd.* TO 'indebel_user'@'%';
FLUSH PRIVILEGES;
EOF

# 6. Vérifier
mysql -u indebel_user -p'indebel_pass' indebel_bd -e "SHOW TABLES;"
```

---

✅ **Suivez ces étapes et votre base de données sera importée sur le serveur!**
