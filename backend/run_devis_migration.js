const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runDevisMigration() {
  let connection;
  try {
    const sqlPath = path.join(__dirname, 'sql/create_devis_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✅ Connecté à la base de données');
    console.log('🔄 Exécution du script SQL creation tables devis...');
    
    await connection.query(sql);
    
    console.log('✅ Tables devis créées avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) await connection.end();
  }
}

runDevisMigration();
