const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectSchema() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        const [rows] = await connection.query('DESCRIBE demandes_devis');
        console.log('Schema for demandes_devis:');
        rows.forEach(row => {
            console.log(`${row.Field} (${row.Type})`);
        });

    } catch (error) {
        console.error('❌ Error inspecting schema:', error);
    } finally {
        if (connection) await connection.end();
    }
}

inspectSchema();
