const db = require('../config/database');

async function addDateFermeture() {
  try {
    console.log('🔄 Ajout de la colonne date_fermeture...\n');
    
    // Ajouter à missions_forfait_horaire
    try {
      await db.query(`
        ALTER TABLE missions_forfait_horaire 
        ADD COLUMN date_fermeture DATE DEFAULT NULL 
        COMMENT 'Date de fermeture automatique de la mission (1 mois après création)'
      `);
      console.log('✅ Colonne ajoutée à missions_forfait_horaire');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne existe déjà dans missions_forfait_horaire');
      } else {
        throw err;
      }
    }
    
    // Ajouter à missions_forfait_fixe
    try {
      await db.query(`
        ALTER TABLE missions_forfait_fixe 
        ADD COLUMN date_fermeture DATE DEFAULT NULL 
        COMMENT 'Date de fermeture automatique de la mission (1 mois après création)'
      `);
      console.log('✅ Colonne ajoutée à missions_forfait_fixe');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne existe déjà dans missions_forfait_fixe');
      } else {
        throw err;
      }
    }
    
    console.log('\n🔄 Calcul des dates de fermeture pour les missions existantes...\n');
    
    // Mettre à jour les missions existantes
    const [hourlyResult] = await db.query(`
      UPDATE missions_forfait_horaire 
      SET date_fermeture = DATE_ADD(date_creation, INTERVAL 1 MONTH)
      WHERE date_fermeture IS NULL
    `);
    console.log(`✅ ${hourlyResult.affectedRows} missions taux horaire mises à jour`);
    
    const [fixedResult] = await db.query(`
      UPDATE missions_forfait_fixe 
      SET date_fermeture = DATE_ADD(date_creation, INTERVAL 1 MONTH)
      WHERE date_fermeture IS NULL
    `);
    console.log(`✅ ${fixedResult.affectedRows} missions fixes mises à jour`);
    
    console.log('\n✅ Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

addDateFermeture();
