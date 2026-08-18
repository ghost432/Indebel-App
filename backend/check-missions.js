require('dotenv').config();
const db = require('./config/database');

async function checkMissions() {
  try {
    console.log('🔍 Vérification des missions...\n');

    // Vérifier missions_forfait_horaire
    const [hourly] = await db.query('SELECT COUNT(*) as count FROM missions_forfait_horaire');
    console.log(`📊 Missions Taux horaire: ${hourly[0].count}`);

    // Vérifier missions_forfait_fixe
    const [fixed] = await db.query('SELECT COUNT(*) as count FROM missions_forfait_fixe');
    console.log(`📊 Missions Forfait fixe: ${fixed[0].count}`);

    // Afficher quelques missions récentes
    const [recentHourly] = await db.query(`
      SELECT id, titre, statut, date_creation 
      FROM missions_forfait_horaire 
      ORDER BY date_creation DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Dernières missions Taux horaire:');
    recentHourly.forEach(m => {
      console.log(`  - [${m.id}] ${m.titre} (${m.statut}) - ${m.date_creation}`);
    });

    const [recentFixed] = await db.query(`
      SELECT id, titre, statut, date_creation 
      FROM missions_forfait_fixe 
      ORDER BY date_creation DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Dernières missions Forfait fixe:');
    recentFixed.forEach(m => {
      console.log(`  - [${m.id}] ${m.titre} (${m.statut}) - ${m.date_creation}`);
    });

    // Vérifier la table jobs
    const [jobs] = await db.query('SELECT COUNT(*) as count FROM jobs');
    console.log(`\n📊 Jobs (offres d'emploi): ${jobs[0].count}`);

    const [recentJobs] = await db.query(`
      SELECT id, titre, statut, date_creation 
      FROM jobs 
      ORDER BY date_creation DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Derniers jobs:');
    recentJobs.forEach(j => {
      console.log(`  - [${j.id}] ${j.titre} (${j.statut}) - ${j.date_creation}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkMissions();
