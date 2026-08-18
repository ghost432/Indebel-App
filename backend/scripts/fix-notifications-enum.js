const db = require('../config/database');

async function fixNotificationsEnum() {
  try {
    console.log('🔧 Correction de l\'ENUM destinataires...\n');

    // Modifier l'ENUM pour ajouter 'specifiques'
    console.log('📋 Modification de la colonne destinataires...');
    await db.query(`
      ALTER TABLE notifications_globales 
      MODIFY COLUMN destinataires ENUM('tous', 'employers', 'freelancers', 'specifiques') DEFAULT 'tous'
    `);
    console.log('✅ ENUM destinataires corrigé');

    console.log('\n🎉 Correction terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

fixNotificationsEnum();
