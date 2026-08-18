// Vérifier toutes les applications et demandes
const db = require('../config/database');

async function checkAllApplications() {
  try {
    console.log('🔍 Vérification de TOUTES les applications dans le système...\n');
    
    // Applications (table applications)
    const [apps] = await db.query(`
      SELECT a.*, j.titre as job_titre, e.denomination as employer_name
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users e ON j.employer_id = e.id
      ORDER BY a.date_creation DESC
    `);
    
    console.log(`📋 === TABLE APPLICATIONS (jobs) ===`);
    console.log(`Total: ${apps.length} application(s)\n`);
    
    if (apps.length > 0) {
      apps.forEach(app => {
        console.log(`Application ID ${app.id}:`);
        console.log(`  - Job: "${app.job_titre}" (ID: ${app.job_id})`);
        console.log(`  - Employeur: ${app.employer_name}`);
        console.log(`  - Statut: ${app.statut}`);
        console.log(`  - Date: ${app.date_creation}\n`);
      });
    } else {
      console.log('  Aucune application trouvée\n');
    }
    
    // Demandes (table demandes_missions)
    const [demandes] = await db.query(`
      SELECT d.*, 
             CASE 
               WHEN d.mission_type = 'hourly' THEN h.titre
               WHEN d.mission_type = 'fixed' THEN f.titre
             END as mission_titre,
             e.denomination as employer_name
      FROM demandes_missions d
      LEFT JOIN missions_forfait_horaire h ON d.mission_id = h.id AND d.mission_type = 'hourly'
      LEFT JOIN missions_forfait_fixe f ON d.mission_id = f.id AND d.mission_type = 'fixed'
      LEFT JOIN users e ON d.employer_id = e.id
      ORDER BY d.date_demande DESC
    `);
    
    console.log(`📋 === TABLE DEMANDES_MISSIONS (missions) ===`);
    console.log(`Total: ${demandes.length} demande(s)\n`);
    
    if (demandes.length > 0) {
      demandes.forEach(dem => {
        console.log(`Demande ID ${dem.id}:`);
        console.log(`  - Mission: "${dem.mission_titre}" (${dem.mission_type}-${dem.mission_id})`);
        console.log(`  - Employeur: ${dem.employer_name}`);
        console.log(`  - Statut: ${dem.statut}`);
        console.log(`  - Date: ${dem.date_demande}\n`);
      });
    } else {
      console.log('  Aucune demande trouvée\n');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

checkAllApplications();
