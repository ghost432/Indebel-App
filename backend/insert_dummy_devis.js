const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertDummyDevis() {
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

        const [result] = await connection.execute(`
      INSERT INTO demandes_devis 
      (type_travaux, categorie, description, urgence, adresse, code_postal, ville, region, prenom, nom, email, telephone, statut, created_at)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
            'Rénovation toiture',
            'Rénovation & Construction',
            'Besoin de réparer des tuiles cassées après la tempête.',
            'urgent',
            '10 Rue de la Gare',
            '1000',
            'Bruxelles',
            'Bruxelles-Capitale',
            'Jean',
            'Dupont',
            'jean.dupont@test.com',
            '0470123456',
            'en_attente'
        ]);

        console.log('✅ Dummy devis inserted with ID:', result.insertId);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

insertDummyDevis();
