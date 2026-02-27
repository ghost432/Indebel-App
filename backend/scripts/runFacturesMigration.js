const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

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
    const migrationPath = path.join(__dirname, '../migrations/create_factures_forfaits.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    console.log('🔄 Exécution de la migration...');
    
    await connection.query(sql);
    
    console.log('✅ Migration exécutée avec succès!');
    console.log('✅ Table factures_forfaits créée');
    
    // Vérifier que la table existe
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'factures_forfaits'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Vérification: Table factures_forfaits existe');
      
      // Afficher la structure
      const [columns] = await connection.query(
        "DESCRIBE factures_forfaits"
      );
      
      console.log('\n📋 Structure de la table:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connexion fermée');
    }
  }
}

runMigration();
