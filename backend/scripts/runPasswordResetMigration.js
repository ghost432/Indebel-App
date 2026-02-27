const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 Migration: Ajout des colonnes de réinitialisation de mot de passe\n');

// Configuration de la connexion
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
});

// Lire le fichier SQL
const migrationPath = path.join(__dirname, '../migrations/add_password_reset_columns.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Fichier de migration chargé');
console.log('⏳ Exécution de la migration...\n');

// Exécuter la migration
connection.query(sql, (error, results) => {
  if (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    connection.end();
    process.exit(1);
  }

  console.log('✅ Migration exécutée avec succès!\n');
  
  // Afficher les résultats
  if (Array.isArray(results)) {
    results.forEach((result, index) => {
      if (result && result.length > 0) {
        console.log(`Résultat ${index + 1}:`, result);
      }
    });
  }

  // Vérifier que les colonnes ont été ajoutées
  connection.query(
    `SHOW COLUMNS FROM users WHERE Field IN ('reset_password_token', 'reset_password_expires')`,
    (error, columns) => {
      if (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
      } else {
        console.log('\n📊 Colonnes ajoutées:');
        columns.forEach(col => {
          console.log(`  ✅ ${col.Field} - ${col.Type}`);
        });
      }

      connection.end();
      console.log('\n✅ Migration terminée!\n');
      process.exit(0);
    }
  );
});
