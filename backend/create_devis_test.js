const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    const [result] = await connection.execute(`
      INSERT INTO demandes_devis 
      (type_travaux, categorie, description, details_complementaires, budget_estime, urgence, adresse, code_postal, ville, region, prenom, nom, email, telephone, statut, created_at, fichiers_joints, images)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `, [
        'Rénovation complète salle de bain',
        'Plomberie & Sanitaire',
        'Nous souhaitons refaire entièrement notre salle de bain de 10m2. Dépose de l\'ancienne baignoire, installation d\'une douche à l\'italienne, pose de nouveau carrelage mural et au sol, et remplacement du meuble double vasque.',
        'La plomberie actuelle est ancienne et devra probablement être adaptée.',
        4500,
        'urgent',
        '25 Avenue Louise',
        '1050',
        'Ixelles',
        'Bruxelles-Capitale',
        'Sophie',
        'Martin',
        'sophie.martin@example.test',
        '0488112233',
        'valide',
        JSON.stringify(['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800']),
        JSON.stringify(['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800'])
    ]);

    console.log('✅ Dummy devis inserted with ID:', result.insertId);
    
    // Call match/notification logic for the devis so it shows up for freelancers in their sector
    const [freelancers] = await connection.execute("SELECT id FROM users WHERE role='freelancer'");
    for (let f of freelancers) {
        await connection.execute('INSERT IGNORE INTO devis_notifications (demande_devis_id, freelancer_id) VALUES (?, ?)', [result.insertId, f.id]);
    }
    console.log('✅ Notifications linked to all freelancers');
    
    await connection.end();
}

run();
