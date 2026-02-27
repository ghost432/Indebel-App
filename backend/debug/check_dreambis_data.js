// Script pour vérifier les données de l'utilisateur dreambis
const db = require('../config/database');

async function checkDreambisData() {
  try {
    console.log('🔍 Recherche de l\'utilisateur dreambis...\n');
    
    // Trouver l'utilisateur
    const [users] = await db.query(
      'SELECT id, email, denomination, role FROM users WHERE denomination LIKE ? OR email LIKE ?',
      ['%dreambis%', '%dreambis%']
    );
    
    if (users.length === 0) {
      console.log('❌ Utilisateur dreambis non trouvé');
      return;
    }
    
    const user = users[0];
    console.log('✅ Utilisateur trouvé:');
    console.log(`   ID: ${user.id}, Email: ${user.email}, Nom: ${user.denomination}, Role: ${user.role}\n`);
    
    const userId = user.id;
    
    // 1. Vérifier les JOBS
    console.log('📋 === JOBS (table jobs) ===');
    const [jobs] = await db.query(
      'SELECT id, titre, statut FROM jobs WHERE employer_id = ?',
      [userId]
    );
    console.log(`   Total: ${jobs.length} job(s)`);
    jobs.forEach(j => {
      console.log(`   - Job ${j.id}: "${j.titre}" (${j.statut})`);
    });
    
    // Compter les applications pour chaque job
    console.log('\n📊 Applications pour chaque job:');
    for (const job of jobs) {
      const [apps] = await db.query(
        'SELECT id, statut FROM applications WHERE job_id = ?',
        [job.id]
      );
      const enAttente = apps.filter(a => a.statut === 'en_attente').length;
      const accepte = apps.filter(a => a.statut === 'accepte').length;
      const refuse = apps.filter(a => a.statut === 'refuse').length;
      console.log(`   - Job ${job.id}: ${apps.length} total (${enAttente} en_attente, ${accepte} accepté, ${refuse} refusé)`);
    }
    
    // 2. Vérifier les MISSIONS
    console.log('\n📋 === MISSIONS (missions_forfait_horaire/fixe) ===');
    const [hourly] = await db.query(
      'SELECT id, titre, statut, "hourly" as type FROM missions_forfait_horaire WHERE employer_id = ?',
      [userId]
    );
    const [fixed] = await db.query(
      'SELECT id, titre, statut, "fixed" as type FROM missions_forfait_fixe WHERE employer_id = ?',
      [userId]
    );
    const missions = [...hourly, ...fixed];
    console.log(`   Total: ${missions.length} mission(s)`);
    missions.forEach(m => {
      console.log(`   - Mission ${m.type}-${m.id}: "${m.titre}" (${m.statut})`);
    });
    
    // Compter les demandes pour chaque mission
    console.log('\n📊 Demandes pour chaque mission:');
    for (const mission of missions) {
      const [demandes] = await db.query(
        'SELECT id, statut FROM demandes_missions WHERE mission_id = ? AND mission_type = ?',
        [mission.id, mission.type]
      );
      const enAttente = demandes.filter(d => d.statut === 'en_attente').length;
      const accepte = demandes.filter(d => d.statut === 'accepte').length;
      const refuse = demandes.filter(d => d.statut === 'refuse').length;
      console.log(`   - Mission ${mission.type}-${mission.id}: ${demandes.length} total (${enAttente} en_attente, ${accepte} accepté, ${refuse} refusé)`);
    }
    
    console.log('\n\n💡 RÉSUMÉ:');
    console.log('   - Page /employer/applications affiche les candidatures des JOBS');
    console.log('   - Page /employer/dreambis/myjob affiche les MISSIONS');
    console.log('   - Ce sont deux systèmes séparés!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

checkDreambisData();
