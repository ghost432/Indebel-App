const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected');

        // Count rows
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM demandes_devis');
        console.log('Row count:', rows[0].count);

        // Check data length of columns
        const [sizes] = await connection.query(`
      SELECT id, 
             LENGTH(description) as desc_len, 
             LENGTH(fichiers_joints) as files_len 
      FROM demandes_devis 
      ORDER BY files_len DESC 
      LIMIT 5
    `);
        console.log('Top 5 rows by file size (bytes):');
        console.table(sizes);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

inspectTable();
