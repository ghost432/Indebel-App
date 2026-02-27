const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✅ Connecté à la base de données');
    console.log('🔄 Exécution des migrations...\n');

    // Liste des migrations
    const migrations = [
      // Ajouter prenom
      {
        name: 'Ajout colonne prenom',
        sql: `ALTER TABLE users ADD COLUMN prenom VARCHAR(100) NULL AFTER nom`
      },
      // Ajouter email_verified
      {
        name: 'Ajout colonne email_verified',
        sql: `ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER email`
      },
      // Ajouter numero_bce
      {
        name: 'Ajout colonne numero_bce',
        sql: `ALTER TABLE users ADD COLUMN numero_bce VARCHAR(10) NULL AFTER role`
      },
      // Ajouter adresse
      {
        name: 'Ajout colonne adresse',
        sql: `ALTER TABLE users ADD COLUMN adresse TEXT NULL AFTER numero_bce`
      },
      // Ajouter pays_code
      {
        name: 'Ajout colonne pays_code',
        sql: `ALTER TABLE users ADD COLUMN pays_code VARCHAR(2) NULL DEFAULT 'BE'`
      },
      // Ajouter indicatif
      {
        name: 'Ajout colonne indicatif',
        sql: `ALTER TABLE users ADD COLUMN indicatif VARCHAR(10) NULL DEFAULT '+32'`
      },
      // Ajouter telephone
      {
        name: 'Ajout colonne telephone',
        sql: `ALTER TABLE users ADD COLUMN telephone VARCHAR(50) NULL`
      },
      // Ajouter secteur
      {
        name: 'Ajout colonne secteur',
        sql: `ALTER TABLE users ADD COLUMN secteur VARCHAR(50) NULL`
      },
      // Ajouter competences
      {
        name: 'Ajout colonne competences',
        sql: `ALTER TABLE users ADD COLUMN competences JSON NULL`
      },
      // Ajouter competences_recherchees
      {
        name: 'Ajout colonne competences_recherchees',
        sql: `ALTER TABLE users ADD COLUMN competences_recherchees JSON NULL`
      },
      // Ajouter accepte_cgu
      {
        name: 'Ajout colonne accepte_cgu',
        sql: `ALTER TABLE users ADD COLUMN accepte_cgu BOOLEAN DEFAULT FALSE NOT NULL`
      },
      // Ajouter accepte_notifications
      {
        name: 'Ajout colonne accepte_notifications',
        sql: `ALTER TABLE users ADD COLUMN accepte_notifications BOOLEAN DEFAULT FALSE`
      },
      // Ajouter accepte_emails
      {
        name: 'Ajout colonne accepte_emails',
        sql: `ALTER TABLE users ADD COLUMN accepte_emails BOOLEAN DEFAULT FALSE`
      }
    ];

    // Exécuter chaque migration
    for (const migration of migrations) {
      try {
        await connection.query(migration.sql);
        console.log(`✅ ${migration.name}`);
      } catch (error) {
        // Ignorer les erreurs "Duplicate column" car elles signifient que la colonne existe déjà
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  ${migration.name} - Colonne déjà existante`);
        } else {
          console.error(`❌ ${migration.name} - Erreur:`, error.message);
        }
      }
    }

    // Créer la table otp_codes si elle n'existe pas
    console.log('\n📋 Création table otp_codes...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        email VARCHAR(100) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        type ENUM('registration', 'login') NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_email (email),
        INDEX idx_otp (otp_code),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table otp_codes créée/vérifiée');

    // Créer la table labels si elle n'existe pas
    console.log('\n📋 Création table labels...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS labels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_revocation TIMESTAMP NULL,
        statut ENUM('actif', 'revoque', 'expire') DEFAULT 'actif',
        type ENUM('automatic', 'direct', 'exceptional') DEFAULT 'automatic',
        attribue_par INT NULL,
        revoque_par INT NULL,
        raison_revocation TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (attribue_par) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (revoque_par) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_statut (statut),
        INDEX idx_date_attribution (date_attribution)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table labels créée/vérifiée');

    // Créer la table exceptional_requests si elle n'existe pas
    console.log('\n📋 Création table exceptional_requests...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS exceptional_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        experience_years VARCHAR(10),
        portfolio_links TEXT,
        special_skills TEXT,
        user_references TEXT,
        additional_info TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        processed_by INT NULL,
        admin_reason TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table exceptional_requests créée/vérifiée');

    // Créer la table exceptional_request_files si elle n'existe pas
    console.log('\n📋 Création table exceptional_request_files...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS exceptional_request_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES exceptional_requests(id) ON DELETE CASCADE,
        INDEX idx_request_id (request_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table exceptional_request_files créée/vérifiée');

    // Afficher la structure
    console.log('\n📊 Structure de la table users:');
    const [columns] = await connection.query('DESCRIBE users');
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
