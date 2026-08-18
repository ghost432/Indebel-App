require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'indebel_db',
      multipleStatements: true
    });

    console.log('✅ Connexion à la base de données établie');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../migrations/create_devis_soumis_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Exécution de la migration create_devis_soumis_table.sql...');

    // Exécuter la migration
    await connection.query(sql);

    console.log('✅ Migration exécutée avec succès !');
    console.log('📋 Tables créées:');
    console.log('   - devis_soumis');
    console.log('   - devis_notifications');
    console.log('📝 Modifications:');
    console.log('   - demandes_devis.statut (ajout devis_complet)');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

runMigration();
