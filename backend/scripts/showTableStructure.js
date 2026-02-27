require('dotenv').config();
const mysql = require('mysql2/promise');

async function showTableStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indebel'
    });

    console.log('✅ Connecté à la base de données\n');

    const [columns] = await connection.query('DESCRIBE users');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              STRUCTURE DE LA TABLE USERS                       ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    columns.forEach((col) => {
      console.log(`Colonne: ${col.Field}`);
      console.log(`  Type: ${col.Type}`);
      console.log(`  Null: ${col.Null}`);
      console.log(`  Default: ${col.Default || 'NULL'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showTableStructure();
