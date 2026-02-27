const db = require('./config/database');

async function createTable() {
    try {
        console.log('Creating table jobs_freelancer...');
        await db.query(`
      CREATE TABLE IF NOT EXISTS jobs_freelancer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        freelancer_id INT NOT NULL,
        titre VARCHAR(255) NOT NULL,
        type_mission VARCHAR(100),
        secteur VARCHAR(100),
        langues_parlees JSON,
        description TEXT,
        competences_requises JSON,
        taux_horaire DECIMAL(10, 2),
        heures_estimees INT,
        budget_fixe DECIMAL(10, 2),
        duree VARCHAR(100),
        type_facturation VARCHAR(50),
        localisation VARCHAR(255),
        ville_mission VARCHAR(100),
        lieu_mission VARCHAR(100),
        autre_lieu VARCHAR(255),
        date_debut DATE,
        nombre_independants INT DEFAULT 1,
        urgente BOOLEAN DEFAULT FALSE,
        type_forfait ENUM('hourly', 'fixed') NOT NULL,
        statut ENUM('en_attente_validation', 'ouvert', 'refuse', 'ferme') DEFAULT 'en_attente_validation',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_fermeture DATE,
        FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('✅ Table jobs_freelancer created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createTable();
