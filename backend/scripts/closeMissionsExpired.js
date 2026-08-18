/**
 * Script pour fermer automatiquement les missions expirées
 * Exécuter ce script régulièrement (ex: cron job quotidien)
 * 
 * Usage: node scripts/closeMissionsExpired.js
 */

const db = require('../config/database');

async function closeExpiredMissions() {
  try {
    console.log('🔍 Recherche des missions expirées...');
    
    // Fermer les missions forfait horaire expirées
    const [hourlyResult] = await db.query(
      `UPDATE missions_forfait_horaire 
       SET statut = 'ferme'
       WHERE date_fermeture < CURDATE() 
       AND statut = 'ouvert'`
    );
    
    // Fermer les missions forfait fixe expirées
    const [fixedResult] = await db.query(
      `UPDATE missions_forfait_fixe 
       SET statut = 'ferme'
       WHERE date_fermeture < CURDATE() 
       AND statut = 'ouvert'`
    );
    
    const totalClosed = hourlyResult.affectedRows + fixedResult.affectedRows;
    
    if (totalClosed > 0) {
      console.log(`✅ ${totalClosed} mission(s) fermée(s) automatiquement`);
      console.log(`   - Missions Taux horaire: ${hourlyResult.affectedRows}`);
      console.log(`   - Missions fixes: ${fixedResult.affectedRows}`);
    } else {
      console.log('ℹ️  Aucune mission expirée trouvée');
    }
    
    // Afficher les prochaines missions à fermer
    const [upcoming] = await db.query(
      `SELECT 'hourly' as type, id, titre, date_fermeture
       FROM missions_forfait_horaire
       WHERE statut = 'ouvert' AND date_fermeture >= CURDATE()
       UNION ALL
       SELECT 'fixed' as type, id, titre, date_fermeture
       FROM missions_forfait_fixe
       WHERE statut = 'ouvert' AND date_fermeture >= CURDATE()
       ORDER BY date_fermeture ASC
       LIMIT 5`
    );
    
    if (upcoming.length > 0) {
      console.log('\n📅 Prochaines missions à fermer:');
      upcoming.forEach(m => {
        const daysLeft = Math.ceil((new Date(m.date_fermeture) - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`   - [${m.type}] "${m.titre}" dans ${daysLeft} jour(s) (${m.date_fermeture})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

closeExpiredMissions();
