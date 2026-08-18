const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Migration des champs de vérification...');

    // Ajouter les colonnes de vérification
    try {
      await db.query(`
        ALTER TABLE users
        ADD COLUMN verification_statut ENUM('non_verifie', 'en_attente', 'verifie', 'refuse') DEFAULT 'non_verifie',
        ADD COLUMN verification_document_type VARCHAR(50) NULL,
        ADD COLUMN verification_document_url VARCHAR(500) NULL,
        ADD COLUMN verification_document_recto_url VARCHAR(500) NULL,
        ADD COLUMN verification_document_verso_url VARCHAR(500) NULL,
        ADD COLUMN verification_selfie_url VARCHAR(500) NULL,
        ADD COLUMN verification_date_soumission TIMESTAMP NULL,
        ADD COLUMN verification_date_validation TIMESTAMP NULL,
        ADD COLUMN verification_admin_id INT NULL,
        ADD COLUMN verification_commentaire TEXT NULL
      `);
      console.log('✅ Colonnes ajoutées');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonnes déjà existantes');
      } else {
        throw error;
      }
    }

    // Ajouter index
    try {
      await db.query(`
        ALTER TABLE users
        ADD INDEX idx_verification_statut (verification_statut)
      `);
      console.log('✅ Index ajouté');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Index déjà existant');
      } else {
        throw error;
      }
    }

    // Ajouter foreign key
    try {
      await db.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_verification_admin
        FOREIGN KEY (verification_admin_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key ajoutée');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
        console.log('ℹ️  Foreign key déjà existante');
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
