const db = require('../config/database');

async function syncDatabase() {
  try {
    console.log('🔄 Synchronisation complète de la base de données...\n');

    // 1. Vérifier et ajouter le champ denomination
    console.log('📋 Vérification du champ denomination...');
    try {
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'denomination'
      `);

      if (columns.length === 0) {
        await db.query(`
          ALTER TABLE users
          ADD COLUMN denomination VARCHAR(255) NULL COMMENT 'Nom de l\'recruteur' AFTER email
        `);
        console.log('✅ Colonne denomination ajoutée');
      } else {
        console.log('ℹ️  Colonne denomination déjà existante');
      }
    } catch (error) {
      console.error('❌ Erreur denomination:', error.message);
    }

    // 2. Vérifier les champs de vérification
    console.log('\n📋 Vérification des champs de vérification...');
    const verificationFields = [
      'verification_statut',
      'verification_document_type',
      'verification_document_recto_url',
      'verification_document_verso_url',
      'verification_selfie_url',
      'verification_date_soumission',
      'verification_date_validation',
      'verification_admin_id',
      'verification_commentaire'
    ];

    for (const field of verificationFields) {
      try {
        const [columns] = await db.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = ?
        `, [field]);

        if (columns.length === 0) {
          // Ajouter les colonnes manquantes
          if (field === 'verification_statut') {
            await db.query(`
              ALTER TABLE users
              ADD COLUMN verification_statut ENUM('non_verifie', 'en_attente', 'verifie', 'refuse') DEFAULT 'non_verifie'
            `);
          } else if (field === 'verification_document_type') {
            await db.query(`ALTER TABLE users ADD COLUMN ${field} VARCHAR(50) NULL`);
          } else if (field.includes('url')) {
            await db.query(`ALTER TABLE users ADD COLUMN ${field} VARCHAR(500) NULL`);
          } else if (field.includes('date')) {
            await db.query(`ALTER TABLE users ADD COLUMN ${field} TIMESTAMP NULL`);
          } else if (field === 'verification_admin_id') {
            await db.query(`ALTER TABLE users ADD COLUMN ${field} INT NULL`);
          } else if (field === 'verification_commentaire') {
            await db.query(`ALTER TABLE users ADD COLUMN ${field} TEXT NULL`);
          }
          console.log(`✅ Colonne ${field} ajoutée`);
        }
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.error(`❌ Erreur ${field}:`, error.message);
        }
      }
    }

    // 3. Vérifier table missions_forfait_horaire
    console.log('\n📋 Vérification table missions_forfait_horaire...');
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS missions_forfait_horaire (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employer_id INT NOT NULL,
          titre VARCHAR(255) NOT NULL,
          type_mission ENUM('jour', 'nuit') NOT NULL,
          categorie VARCHAR(100) NOT NULL,
          langues_parlees JSON NOT NULL,
          description TEXT NOT NULL,
          competences JSON NOT NULL,
          forfait_heure DECIMAL(10, 2) NOT NULL,
          heures_travail_max INT NOT NULL,
          type_facturation ENUM('jour', 'semaine', 'mois') NOT NULL,
          adresse_mission VARCHAR(255) NOT NULL,
          lieu_mission ENUM('site_recruteur', 'autre_site') NOT NULL,
          autre_lieu VARCHAR(255) NULL,
          date_debut DATE NOT NULL,
          nombre_independants INT NOT NULL DEFAULT 1,
          statut ENUM('ouvert', 'ferme', 'en_cours', 'termine') DEFAULT 'ouvert',
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_employer (employer_id),
          INDEX idx_statut (statut),
          FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table missions_forfait_horaire vérifiée');
    } catch (error) {
      console.error('❌ Erreur missions_forfait_horaire:', error.message);
    }

    // 4. Vérifier table missions_forfait_fixe
    console.log('\n📋 Vérification table missions_forfait_fixe...');
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS missions_forfait_fixe (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employer_id INT NOT NULL,
          titre VARCHAR(255) NOT NULL,
          type_mission ENUM('jour', 'nuit') NOT NULL,
          categorie VARCHAR(100) NOT NULL,
          langues_parlees JSON NOT NULL,
          description TEXT NOT NULL,
          competences JSON NOT NULL,
          forfait_mission DECIMAL(10, 2) NOT NULL,
          temps_max_estime INT NOT NULL,
          type_facturation ENUM('jour', 'semaine', 'mois') NOT NULL,
          adresse_mission VARCHAR(255) NOT NULL,
          lieu_mission ENUM('site_recruteur', 'autre_site') NOT NULL,
          autre_lieu VARCHAR(255) NULL,
          date_debut DATE NOT NULL,
          nombre_independants INT NOT NULL DEFAULT 1,
          statut ENUM('ouvert', 'ferme', 'en_cours', 'termine') DEFAULT 'ouvert',
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_employer (employer_id),
          INDEX idx_statut (statut),
          FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table missions_forfait_fixe vérifiée');
    } catch (error) {
      console.error('❌ Erreur missions_forfait_fixe:', error.message);
    }

    // 5. Vérifier table demandes_missions
    console.log('\n📋 Vérification table demandes_missions...');
    try {
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
      console.log('✅ Table demandes_missions vérifiée');

      // Ajouter contrainte unique
      try {
        await db.query(`
          ALTER TABLE demandes_missions 
          ADD UNIQUE KEY unique_demande (mission_id, mission_type, freelancer_id)
        `);
        console.log('✅ Contrainte unique ajoutée');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️  Contrainte unique déjà existante');
        }
      }
    } catch (error) {
      console.error('❌ Erreur demandes_missions:', error.message);
    }

    // 6. Ajouter index sur verification_statut
    console.log('\n📋 Vérification index verification_statut...');
    try {
      await db.query(`
        ALTER TABLE users
        ADD INDEX idx_verification_statut (verification_statut)
      `);
      console.log('✅ Index verification_statut ajouté');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Index déjà existant');
      }
    }

    // 7. Ajouter foreign key verification_admin_id
    console.log('\n📋 Vérification foreign key verification_admin_id...');
    try {
      await db.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_verification_admin
        FOREIGN KEY (verification_admin_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key verification_admin_id ajoutée');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
        console.log('ℹ️  Foreign key déjà existante');
      }
    }

    // 8. Mettre à jour les employers existants sans denomination
    console.log('\n📋 Mise à jour des employeurs...');
    try {
      const [employers] = await db.query(`
        SELECT id, nom, prenom FROM users 
        WHERE role = 'employer' AND (denomination IS NULL OR denomination = '')
      `);

      for (const employer of employers) {
        const denomination = `${employer.prenom || ''} ${employer.nom || ''}`.trim() || 'Recruteur';
        await db.query('UPDATE users SET denomination = ? WHERE id = ?', [denomination, employer.id]);
      }
      
      if (employers.length > 0) {
        console.log(`✅ ${employers.length} employeur(s) mis à jour avec denomination`);
      } else {
        console.log('ℹ️  Tous les employeurs ont déjà une denomination');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour employeurs:', error.message);
    }

    // 9. Statistiques finales
    console.log('\n📊 Statistiques de la base de données:');
    
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Utilisateurs: ${userCount[0].count}`);

    const [employerCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "employer"');
    console.log(`🏢 Employeurs: ${employerCount[0].count}`);

    const [freelancerCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "freelancer"');
    console.log(`👤 Prestataires: ${freelancerCount[0].count}`);

    const [hourlyCount] = await db.query('SELECT COUNT(*) as count FROM missions_forfait_horaire');
    console.log(`⏱️  Missions Taux horaire: ${hourlyCount[0].count}`);

    const [fixedCount] = await db.query('SELECT COUNT(*) as count FROM missions_forfait_fixe');
    console.log(`💰 Missions fixes: ${fixedCount[0].count}`);

    const [demandesCount] = await db.query('SELECT COUNT(*) as count FROM demandes_missions');
    console.log(`📮 Demandes: ${demandesCount[0].count}`);

    const [verifiedCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE verification_statut = "verifie"');
    console.log(`✅ Profils vérifiés: ${verifiedCount[0].count}`);

    console.log('\n🎉 Synchronisation terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la synchronisation:', error);
    process.exit(1);
  }
}

syncDatabase();
