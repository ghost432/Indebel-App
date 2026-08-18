const db = require('../config/database');

async function run() {
  try {
    const [forfaitsCols] = await db.query(`SHOW COLUMNS FROM forfaits`);
    console.log("Forfaits Columns:", forfaitsCols.map(c => c.Field));
    
    // Add columns if they don't exist
    const hasLimiteCandIA = forfaitsCols.some(c => c.Field === 'limite_candidature_ia');
    if (!hasLimiteCandIA) {
      await db.query(`ALTER TABLE forfaits ADD COLUMN limite_candidature_ia INT NULL COMMENT 'Limite IA candidatures missions'`);
      console.log("Added limite_candidature_ia to forfaits");
    }

    const hasMaxVuesMissions = forfaitsCols.some(c => c.Field === 'max_vues_missions');
    if (!hasMaxVuesMissions) {
      await db.query(`ALTER TABLE forfaits ADD COLUMN max_vues_missions INT NULL COMMENT 'Max vues missions'`);
      console.log("Added max_vues_missions to forfaits");
    }
    
    const [userCols] = await db.query(`SHOW COLUMNS FROM users`);
    const hasCompteurCandIA = userCols.some(c => c.Field === 'compteur_candidature_ia');
    if (!hasCompteurCandIA) {
      await db.query(`ALTER TABLE users ADD COLUMN compteur_candidature_ia INT DEFAULT 0, ADD COLUMN compteur_candidature_ia_reset_at DATE NULL DEFAULT NULL`);
      console.log("Added compteur_candidature_ia to users");
    }

    // Create mission_page_views table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mission_page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        mission_id INT NOT NULL,
        mission_type VARCHAR(50) NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) NULL,
        INDEX idx_user_mission (user_id, mission_id, mission_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Created mission_page_views table");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
