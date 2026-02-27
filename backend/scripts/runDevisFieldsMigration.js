const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Créer la connexion
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connecté à la base de données');

    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, '../migrations/add_devis_fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Exécuter la migration
    await connection.query(sql);
    
    console.log('✅ Migration des champs devis exécutée avec succès !');
    console.log('   - Colonne heure_souhaite ajoutée');
    console.log('   - Colonne region ajoutée');
    console.log('   - Colonne images ajoutée');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
