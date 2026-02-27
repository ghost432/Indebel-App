const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Migration de la table demandes_missions...');

    // Créer la table demandes_missions
    await db.query(`
      CREATE TABLE IF NOT EXISTS demandes_missions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mission_id INT NOT NULL,
        mission_type ENUM('hourly', 'fixed') NOT NULL,
        freelancer_id INT NOT NULL,
        employer_id INT NOT NULL,
        statut ENUM('en_attente', 'accepte', 'refuse') DEFAULT 'en_attente',
        message_freelancer TEXT,
        date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_reponse TIMESTAMP NULL,
        INDEX idx_mission (mission_id, mission_type),
        INDEX idx_freelancer (freelancer_id),
        INDEX idx_employer (employer_id),
        INDEX idx_statut (statut),
        FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Table demandes_missions créée');

    // Ajouter contrainte unique si elle n'existe pas déjà
    try {
      await db.query(`
        ALTER TABLE demandes_missions 
        ADD UNIQUE KEY unique_demande (mission_id, mission_type, freelancer_id)
      `);
      console.log('✅ Contrainte unique ajoutée');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Contrainte unique déjà existante');
      } else {
        throw error;
      }
    }

    console.log('🎉 Migration terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrate();
