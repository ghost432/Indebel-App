const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration complète vérifications identité...');

    const migrationPath = path.join(__dirname, '../migrations/create_verifications_complete.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    for (const query of queries) {
      console.log('📝 Exécution de la requête...');
      await db.query(query);
      console.log('✅ Requête exécutée avec succès');
    }

    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Table créée: verifications_identite avec tous les champs:');
    console.log('   ✓ Informations personnelles (nom, date naissance, adresse, téléphone, email)');
    console.log('   ✓ Documents identité (type_document avec titre_sejour, numéro, recto, verso, selfie)');
    console.log('   ✓ Documents professionnels (assurance RC, justificatif domicile, extrait BCE, attestation cotisations)');
    console.log('   ✓ Permis de conduire (checkbox, catégorie, document)');
    console.log('   ✓ Permis chariot (checkbox, nombre, document)');
    console.log('   ✓ Statut et traitement (statut, motif_refus, dates, admin)');
    console.log('📋 Colonne ajoutée: statut_verification dans users');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
