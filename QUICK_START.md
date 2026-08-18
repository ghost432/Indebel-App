# ⚡ QUICK START - Import Base de Données

## 🎯 Problème Résolu
✅ Erreur de contrainte de clé étrangère lors de l'import corrigée  
✅ Fichier SQL optimisé créé: `IMPORT_PHPMYADMIN_OPTIMAL.sql`  
✅ Script de déploiement prêt: `deploy_import_bd.sh`

---

## 🚀 DÉMARRAGE RAPIDE (3 étapes)

### 1️⃣ Transférer vers le serveur
```bash
cd /home/thierry-ninja/CascadeProjects/windsurf-project-3/indebel
./deploy_import_bd.sh
```

### 2️⃣ Importer sur le serveur

**Option A - Via phpMyAdmin (recommandé):**
1. Allez sur phpMyAdmin
2. Exécutez: `DROP DATABASE IF EXISTS indebel_bd;`
3. Exécutez: `CREATE DATABASE indebel_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
4. Importez le fichier `IMPORT_PHPMYADMIN_OPTIMAL.sql`

**Option B - Via SSH:**
```bash
ssh root@89.116.245.231

# Recréer la base
mysql -u root -p << EOF
DROP DATABASE IF EXISTS indebel_bd;
CREATE DATABASE indebel_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# Importer
mysql -u root -p indebel_bd < /root/IMPORT_PHPMYADMIN_OPTIMAL.sql
```

### 3️⃣ Vérifier et redémarrer
```bash
# Vérifier
mysql -u root -p -e "USE indebel_bd; SHOW TABLES; SELECT COUNT(*) FROM users;"

# Redémarrer l'API
pm2 restart indebel-api
pm2 logs indebel-api --lines 50
```

---

## 📚 Documentation Complète

- **`RESUME_CORRECTION_BD.md`** ← Résumé exécutif
- **`SOLUTION_IMPORT_BD.md`** ← Guide détaillé
- **`deploy_import_bd.sh`** ← Script de déploiement
- **`IMPORT_PHPMYADMIN_OPTIMAL.sql`** ← Fichier SQL corrigé

---

## ✅ Résultats Attendus

Après l'import:
- ✅ 18 tables créées
- ✅ 24 contraintes de clés étrangères actives
- ✅ Toutes les données importées
- ✅ Pas d'erreurs de contraintes

Tables principales:
- `users` (utilisateurs)
- `jobs` (offres d'emploi)
- `applications` (candidatures)
- `otp_codes` (codes OTP)
- `messages`, `conversations`, etc.

---

## 🔧 Dépannage Express

**Erreur de permissions:**
```sql
GRANT ALL PRIVILEGES ON indebel_bd.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

**Vérifier MySQL:**
```bash
systemctl status mysql
systemctl restart mysql
```

**Espace disque:**
```bash
df -h
```

**Voir les logs:**
```bash
tail -f /var/log/mysql/error.log
```

---

**🚀 C'EST PARTI!**

Lancez: `./deploy_import_bd.sh` et suivez les instructions.
