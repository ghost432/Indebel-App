const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertFullDevis() {
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

        // Dummy base64 image (small red dot)
        const dummyImage = {
            name: 'test_image.png',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };

        const [result] = await connection.execute(`
      INSERT INTO demandes_devis 
      (type_travaux, categorie, description, urgence, adresse, code_postal, ville, region, prenom, nom, email, telephone, date_souhaite, heure_souhaite, budget_estime, fichiers_joints, statut, created_at)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
            'Installation Panneaux Solaires',
            'Énergie',
            'Installation complète sur toiture inclinee sud. Besoin de devis détaillé.',
            'urgent',
            '25 Avenue Louise',
            '1050',
            'Bruxelles',
            'Bruxelles-Capitale',
            'Sophie',
            'Martin',
            'sophie.martin@test.com',
            '0470987654',
            '2025-01-15',
            '14:00',
            '15000',
            JSON.stringify([dummyImage]),
            'en_attente'
        ]);

        console.log('✅ Full dummy devis inserted with ID:', result.insertId);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

insertFullDevis();
