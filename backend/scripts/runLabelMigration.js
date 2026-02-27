const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🏷️  Migration: Création du système Label Indebel\n');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
});

const migrationPath = path.join(__dirname, '../migrations/create_label_indebel.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Fichier de migration chargé');
console.log('⏳ Exécution de la migration...\n');

connection.query(sql, (error, results) => {
  if (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    connection.end();
    process.exit(1);
  }

  console.log('✅ Migration exécutée avec succès!\n');
  
  if (Array.isArray(results)) {
    results.forEach((result, index) => {
      if (result && result.length > 0) {
        console.log(`Résultat ${index + 1}:`, result);
      }
    });
  }

  connection.query(
    `SHOW TABLES LIKE 'label%'`,
    (error, tables) => {
      if (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
      } else {
        console.log('\n📊 Tables créées:');
        tables.forEach(table => {
          console.log(`  ✅ ${Object.values(table)[0]}`);
        });
      }

      connection.end();
      console.log('\n✅ Migration terminée!\n');
      process.exit(0);
    }
  );
});
