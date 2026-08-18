const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanTables() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log('🗑️ Truncating devis_notifications...');
        await connection.query('TRUNCATE TABLE devis_notifications');

        console.log('🗑️ Truncating devis_soumis...');
        await connection.query('TRUNCATE TABLE devis_soumis');

        console.log('🗑️ Truncating demandes_devis...');
        await connection.query('TRUNCATE TABLE demandes_devis');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Tables cleaned');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

cleanTables();
