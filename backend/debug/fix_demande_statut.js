// Vérifier et corriger les statuts de demandes invalides
const db = require('../config/database');

async function fixDemandeStatut() {
  try {
    console.log('🔍 Vérification des statuts de demandes...\n');
    
    // Récupérer toutes les demandes avec leurs statuts
    const [demandes] = await db.query(
      'SELECT id, mission_id, mission_type, statut, employer_id FROM demandes_missions'
    );
    
    console.log(`📊 Total: ${demandes.length} demande(s) trouvée(s)\n`);
    
    const validStatuts = ['en_attente', 'accepte', 'refuse'];
    const invalidDemandes = demandes.filter(d => !validStatuts.includes(d.statut));
    
    if (invalidDemandes.length > 0) {
      console.log(`⚠️  ${invalidDemandes.length} demande(s) avec statut invalide:\n`);
      
      for (const demande of invalidDemandes) {
        console.log(`  Demande ID ${demande.id}:`);
        console.log(`    - Mission: ${demande.mission_type}-${demande.mission_id}`);
        console.log(`    - Statut actuel: "${demande.statut}"`);
        console.log(`    - Action: Correction en "refuse"\n`);
        
        // Corriger le statut invalide
        await db.query(
          'UPDATE demandes_missions SET statut = ? WHERE id = ?',
          ['refuse', demande.id]
        );
      }
      
      console.log('✅ Statuts corrigés!\n');
    } else {
      console.log('✅ Tous les statuts sont valides\n');
    }
    
    // Afficher le résumé final
    const [summary] = await db.query(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM demandes_missions
      GROUP BY statut
    `);
    
    console.log('📈 Résumé des statuts:');
    summary.forEach(s => {
      console.log(`  - ${s.statut}: ${s.count}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

fixDemandeStatut();
