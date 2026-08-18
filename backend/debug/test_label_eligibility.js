const db = require('../config/database');

async function testLabelEligibility() {
  try {
    console.log('🔍 Test d\'éligibilité au label...\n');

    // Vérifier la structure des tables
    console.log('📊 Vérification des tables de missions...');
    
    const [fixeTables] = await db.query('SHOW COLUMNS FROM missions_forfait_fixe');
    const [horaireTables] = await db.query('SHOW COLUMNS FROM missions_forfait_horaire');
    const [appTables] = await db.query('SHOW COLUMNS FROM applications');

    console.log(`✅ Table missions_forfait_fixe: ${fixeTables.length} colonnes`);
    console.log(`✅ Table missions_forfait_horaire: ${horaireTables.length} colonnes`);
    console.log(`✅ Table applications: ${appTables.length} colonnes`);

    // Test des requêtes pour un utilisateur
    const testUserId = 8; // ID de test

    console.log(`\n🔍 Test pour l'utilisateur ID: ${testUserId}`);

    // Test missions via jobs
    const [missionStats] = await db.query(
      `SELECT COUNT(*) as missions_completed 
       FROM jobs j 
       JOIN applications a ON j.id = a.job_id 
       WHERE a.freelancer_id = ? AND a.statut = 'accepte' AND j.statut = 'ferme'`,
      [testUserId]
    );

    console.log(`📊 Missions terminées: ${missionStats[0].missions_completed}`);

    // Test évaluations
    const [ratingStats] = await db.query(
      `SELECT AVG(note) as average_rating, COUNT(*) as total_evaluations 
       FROM evaluations 
       WHERE freelancer_id = ?`,
      [testUserId]
    );

    console.log(`⭐ Note moyenne: ${ratingStats[0].average_rating || 'N/A'}`);
    console.log(`📝 Nombre d'évaluations: ${ratingStats[0].total_evaluations}`);

    console.log('\n✅ Test d\'éligibilité terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    process.exit(0);
  }
}

testLabelEligibility();
