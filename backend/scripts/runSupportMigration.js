require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indebel',
      multipleStatements: true
    });

    console.log('✅ Connecté à la base de données\n');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../migrations/create_support_tickets.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Exécution de la migration...\n');

    // Exécuter la migration
    await connection.query(sql);

    console.log('✅ Migration exécutée avec succès!\n');
    console.log('Tables créées:');
    console.log('  - support_tickets');
    console.log('  - support_responses\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
