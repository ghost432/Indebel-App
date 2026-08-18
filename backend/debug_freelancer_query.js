const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testQuery() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'indebel'
    };

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        const freelancerId = 1; // Assuming ID 1 or we'll find one

        // Get a freelancer ID
        const [freelancers] = await connection.query("SELECT id FROM users WHERE role = 'freelancer' LIMIT 1");
        const testId = freelancers.length > 0 ? freelancers[0].id : 1;
        console.log('Testing with freelancer ID:', testId);

        const query = `
      SELECT 
        dd.id,
        dd.type_travaux,
        dd.categorie,
        dd.description,
        dd.urgence,
        dd.adresse,
        dd.code_postal,
        dd.ville,
        dd.region,
        dd.prenom,
        dd.nom,
        dd.email,
        dd.telephone,
        dd.date_souhaite,
        dd.heure_souhaite,
        dd.budget_estime,
        dd.details_complementaires,
        dd.fichiers_joints,
        dd.statut,
        dd.created_at,
        dd.updated_at,
        COALESCE((
          SELECT COUNT(*) 
          FROM devis_soumis ds 
          WHERE ds.demande_devis_id = dd.id
        ), 0) as nb_devis_soumis,
        EXISTS(
          SELECT 1 
          FROM devis_soumis ds_mine 
          WHERE ds_mine.demande_devis_id = dd.id 
          AND ds_mine.freelancer_id = ?
        ) as deja_soumis
      FROM demandes_devis dd
      WHERE dd.statut = 'valide'
      HAVING nb_devis_soumis < 5
      ORDER BY dd.created_at DESC
    `;

        try {
            const [rows] = await connection.query(query, [testId]);
            console.log('Query successful, rows:', rows.length);
        } catch (err) {
            console.error('Query failed:', err.message);
            console.error('Full error:', err);
        }

        await connection.end();
    } catch (error) {
        console.error('Connection error:', error);
    }
}

testQuery();
