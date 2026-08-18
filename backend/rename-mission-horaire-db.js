const db = require('./config/database');

async function renameMissionHoraire() {
  try {
    console.log('🔄 Début du renommage "Mission horaire" → "Mission Taux horaire"...\n');

    // ============================================
    // 1. TABLE MISSIONS_FORFAIT_HORAIRE
    // ============================================
    console.log('📝 Mise à jour de la table missions_forfait_horaire...');
    
    await db.query(`
      UPDATE missions_forfait_horaire 
      SET titre = REPLACE(REPLACE(REPLACE(titre, 
        'Mission horaire', 'Mission Taux horaire'),
        'mission horaire', 'mission taux horaire'),
        'MISSION HORAIRE', 'MISSION TAUX HORAIRE')
      WHERE titre IS NOT NULL
    `);
    
    await db.query(`
      UPDATE missions_forfait_horaire 
      SET description = REPLACE(REPLACE(REPLACE(description, 
        'Mission horaire', 'Mission Taux horaire'),
        'mission horaire', 'mission taux horaire'),
        'MISSION HORAIRE', 'MISSION TAUX HORAIRE')
      WHERE description IS NOT NULL
    `);
    
    console.log('✅ Table missions_forfait_horaire mise à jour\n');

    // ============================================
    // 2. TABLE NOTIFICATIONS
    // ============================================
    console.log('📝 Mise à jour de la table notifications...');
    
    await db.query(`
      UPDATE notifications 
      SET titre = REPLACE(REPLACE(REPLACE(titre, 
        'Mission horaire', 'Mission Taux horaire'),
        'mission horaire', 'mission taux horaire'),
        'MISSION HORAIRE', 'MISSION TAUX HORAIRE')
    `);
    
    await db.query(`
      UPDATE notifications 
      SET message = REPLACE(REPLACE(REPLACE(message, 
        'Mission horaire', 'Mission Taux horaire'),
        'mission horaire', 'mission taux horaire'),
        'MISSION HORAIRE', 'MISSION TAUX HORAIRE')
    `);
    
    console.log('✅ Table notifications mise à jour\n');

    // ============================================
    // 3. TABLE JOBS (si applicable)
    // ============================================
    console.log('📝 Mise à jour de la table jobs...');
    
    await db.query(`
      UPDATE jobs 
      SET titre = REPLACE(REPLACE(REPLACE(titre, 
        'Mission horaire', 'Mission Taux horaire'),
        'mission horaire', 'mission taux horaire'),
        'MISSION HORAIRE', 'MISSION TAUX HORAIRE')
      WHERE titre IS NOT NULL
    `);
    
    await db.query(`
      UPDATE jobs 
      SET description = REPLACE(REPLACE(REPLACE(description, 
        'Mission horaire', 'Mission Taux horaire'),
        'mission horaire', 'mission taux horaire'),
        'MISSION HORAIRE', 'MISSION TAUX HORAIRE')
      WHERE description IS NOT NULL
    `);
    
    console.log('✅ Table jobs mise à jour\n');

    console.log('✅ Renommage terminé avec succès !');
    console.log('\n📋 Résumé des modifications :');
    console.log('   • "Mission horaire" → "Mission Taux horaire"');
    console.log('   • "mission horaire" → "mission taux horaire"');
    console.log('   • "MISSION HORAIRE" → "MISSION TAUX HORAIRE"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du renommage :', error.message);
    console.error(error);
    process.exit(1);
  }
}

renameMissionHoraire();
