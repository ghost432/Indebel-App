require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    console.log('🔄 Connexion à la base de données...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indebel_bd',
      multipleStatements: true
    });

    console.log('✅ Connecté à la base de données');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../migrations/create_demandes_devis.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Exécution de la migration...');
    
    await connection.query(migrationSQL);

    console.log('✅ Migration exécutée avec succès !');
    console.log('');
    console.log('📊 Tables créées:');
    console.log('  - demandes_devis');
    console.log('  - categories_travaux');
    console.log('');
    console.log('✅ Système de demande de devis prêt !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
