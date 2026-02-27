// Script de débogage pour vérifier les demandes dans la base de données
const db = require('../config/database');

async function checkDemandes() {
  try {
    console.log('🔍 Vérification des demandes pour la mission fixed-2...\n');
    
    // Vérifier si la mission existe
    const [missions] = await db.query(
      'SELECT id, titre, statut, employer_id FROM missions_forfait_fixe WHERE id = 2'
    );
    
    if (missions.length === 0) {
      console.log('❌ Mission fixed-2 n\'existe pas dans la base de données');
      return;
    }
    
    console.log('✅ Mission trouvée:');
    console.log(missions[0]);
    console.log('\n');
    
    // Vérifier les demandes pour cette mission
    const [demandes] = await db.query(
      `SELECT 
        d.*,
        f.prenom as freelancer_prenom,
        f.nom as freelancer_nom,
        f.email as freelancer_email
       FROM demandes_missions d
       LEFT JOIN users f ON d.freelancer_id = f.id
       WHERE d.mission_id = 2 AND d.mission_type = 'fixed'
       ORDER BY d.date_demande DESC`
    );
    
    console.log(`📊 Nombre de demandes trouvées: ${demandes.length}\n`);
    
    if (demandes.length > 0) {
      console.log('Détails des demandes:');
      demandes.forEach((d, index) => {
        console.log(`\nDemande ${index + 1}:`);
        console.log(`  - ID: ${d.id}`);
        console.log(`  - Freelancer: ${d.freelancer_prenom} ${d.freelancer_nom} (${d.freelancer_email})`);
        console.log(`  - Statut: ${d.statut}`);
        console.log(`  - Date: ${d.date_demande}`);
        console.log(`  - Message: ${d.message_freelancer}`);
      });
    } else {
      console.log('ℹ️  Aucune demande trouvée pour cette mission.');
      console.log('   Cela signifie qu\'aucun freelancer n\'a encore postulé.');
    }
    
    // Vérifier toutes les demandes pour cet employer
    const [allDemandes] = await db.query(
      `SELECT mission_id, mission_type, COUNT(*) as count
       FROM demandes_missions
       WHERE employer_id = ?
       GROUP BY mission_id, mission_type`,
      [missions[0].employer_id]
    );
    
    console.log('\n\n📋 Récapitulatif de toutes les demandes pour cet employeur:');
    if (allDemandes.length > 0) {
      allDemandes.forEach(d => {
        console.log(`  - ${d.mission_type}-${d.mission_id}: ${d.count} demande(s)`);
      });
    } else {
      console.log('  Aucune demande pour cet employeur.');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

checkDemandes();
