const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runForfaitsMigration() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'indebel_db',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✅ Connecté à la base de données');
    console.log('🔄 Exécution de la migration des forfaits...\n');
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'migrations', 'update_forfaits_nov2025.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // Exécuter le SQL
    await connection.query(sqlContent);
    
    console.log('\n✅ Migration des forfaits terminée avec succès!');
    
    // Afficher les nouveaux forfaits
    console.log('\n📋 Nouveaux forfaits créés:');
    const [forfaits] = await connection.query(`
      SELECT id, nom, type_utilisateur, prix_mensuel, max_missions, actif, recommande 
      FROM forfaits 
      WHERE actif = TRUE
      ORDER BY type_utilisateur, prix_mensuel
    `);
    console.table(forfaits);
    
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

runForfaitsMigration();
