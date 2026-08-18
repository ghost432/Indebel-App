const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectDevis2() {
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

        const [rows] = await connection.query('SELECT id, fichiers_joints FROM demandes_devis WHERE id = 2');

        if (rows.length > 0) {
            console.log('Devis ID 2 files raw:');
            console.log(rows[0].fichiers_joints);

            // Try parsing if possible
            try {
                if (typeof rows[0].fichiers_joints === 'string') {
                    console.log('Parsed:', JSON.parse(rows[0].fichiers_joints));
                } else {
                    console.log('Already object:', rows[0].fichiers_joints);
                }
            } catch (e) {
                console.log('Error parsing JSON:', e.message);
            }
        } else {
            console.log('Devis ID 2 not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

inspectDevis2();
