const mysql = require('mysql2');
require('dotenv').config();

console.log('🔍 Test de connexion à la base de données...\n');

console.log('Configuration:');
console.log(`  Host: ${process.env.DB_HOST || 'non défini'}`);
console.log(`  User: ${process.env.DB_USER || 'non défini'}`);
console.log(`  Database: ${process.env.DB_NAME || 'non défini'}`);
console.log(`  Port: ${process.env.DB_PORT || 3306}`);
console.log('');

// Test de connexion simple
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000
});

console.log('⏳ Tentative de connexion...');

connection.connect((err) => {
  if (err) {
    console.error('\n❌ Erreur de connexion:');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    console.error('  Errno:', err.errno);
    console.error('  SQLState:', err.sqlState);
    
    if (err.code === 'ETIMEDOUT') {
      console.error('\n⚠️  TIMEOUT: La base de données ne répond pas.');
      console.error('  Vérifiez:');
      console.error('    - Que la base de données est démarrée');
      console.error('    - Que l\'adresse IP est autorisée');
      console.error('    - Que le firewall autorise la connexion');
      console.error('    - Que le port est correct');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  ACCÈS REFUSÉ: Identifiants incorrects.');
      console.error('  Vérifiez:');
      console.error('    - Le nom d\'utilisateur');
      console.error('    - Le mot de passe');
      console.error('    - Les privilèges de l\'utilisateur');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\n⚠️  HOST NON TROUVÉ: L\'adresse de la base de données est incorrecte.');
    }
    
    process.exit(1);
  }

  console.log('✅ Connexion réussie!\n');

  // Test de requête simple
  connection.query('SELECT 1 + 1 AS solution', (error, results) => {
    if (error) {
      console.error('❌ Erreur lors de la requête test:', error.message);
      connection.end();
      process.exit(1);
    }

    console.log('✅ Requête test réussie:', results[0].solution);

    // Vérifier les tables support
    connection.query('SHOW TABLES LIKE "support%"', (error, results) => {
      if (error) {
        console.error('❌ Erreur lors de la vérification des tables:', error.message);
      } else {
        console.log('\n📊 Tables support trouvées:');
        if (results.length === 0) {
          console.log('  ⚠️  Aucune table support trouvée!');
          console.log('  Exécutez la migration: node scripts/runSupportMigration.js');
        } else {
          results.forEach(row => {
            console.log(`  ✅ ${Object.values(row)[0]}`);
          });
        }
      }

      console.log('\n✅ Test terminé avec succès!\n');
      connection.end();
      process.exit(0);
    });
  });
});

// Timeout global
setTimeout(() => {
  console.error('\n❌ TIMEOUT GLOBAL: Le test a pris trop de temps (30s)');
  process.exit(1);
}, 30000);
