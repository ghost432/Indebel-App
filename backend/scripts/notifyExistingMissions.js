/**
 * Script pour envoyer des notifications pour les missions existantes
 * À exécuter une seule fois pour rattraper les missions déjà publiées
 */

const db = require('../config/database');
const additionalNotif = require('../services/additionalNotifications');

async function notifyExistingMissions() {
  try {
    console.log('🚀 Démarrage du script de notification des missions existantes...\n');

    // Récupérer toutes les missions ouvertes (hourly)
    const [hourlyMissions] = await db.query(`
      SELECT m.id, m.titre, m.employer_id, m.date_creation,
             u.denomination, u.prenom, u.nom
      FROM missions_forfait_horaire m
      LEFT JOIN users u ON m.employer_id = u.id
      WHERE m.statut = 'ouvert'
      ORDER BY m.date_creation DESC
    `);

    // Récupérer toutes les missions ouvertes (fixed)
    const [fixedMissions] = await db.query(`
      SELECT m.id, m.titre, m.employer_id, m.date_creation,
             u.denomination, u.prenom, u.nom
      FROM missions_forfait_fixe m
      LEFT JOIN users u ON m.employer_id = u.id
      WHERE m.statut = 'ouvert'
      ORDER BY m.date_creation DESC
    `);

    const totalMissions = hourlyMissions.length + fixedMissions.length;
    console.log(`📋 ${totalMissions} mission(s) trouvée(s):`);
    console.log(`   - ${hourlyMissions.length} mission(s) horaire`);
    console.log(`   - ${fixedMissions.length} mission(s) fixe\n`);

    let notifiedMissions = 0;

    // Notifier pour chaque mission hourly
    for (const mission of hourlyMissions) {
      const employerName = mission.denomination || `${mission.prenom} ${mission.nom}`;
      console.log(`📤 Notification mission: "${mission.titre}" (${employerName})`);
      
      try {
        await additionalNotif.notifyFreelancersNewMission(
          mission.titre,
          'hourly',
          employerName,
          mission.id
        );
        notifiedMissions++;
        console.log(`   ✅ Notifications envoyées\n`);
      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}\n`);
      }

      // Pause de 2 secondes entre chaque mission pour éviter spam
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Notifier pour chaque mission fixed
    for (const mission of fixedMissions) {
      const employerName = mission.denomination || `${mission.prenom} ${mission.nom}`;
      console.log(`📤 Notification mission: "${mission.titre}" (${employerName})`);
      
      try {
        await additionalNotif.notifyFreelancersNewMission(
          mission.titre,
          'fixed',
          employerName,
          mission.id
        );
        notifiedMissions++;
        console.log(`   ✅ Notifications envoyées\n`);
      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}\n`);
      }

      // Pause de 2 secondes entre chaque mission
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Script terminé avec succès !`);
    console.log(`📊 ${notifiedMissions}/${totalMissions} mission(s) notifiée(s)`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
notifyExistingMissions();
