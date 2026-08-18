const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration extension vérifications identité v2...');

    const migrationPath = path.join(__dirname, '../migrations/extend_verifications_identite_v2.sql');
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
    console.log('📋 Nouveaux champs ajoutés à verifications_identite:');
    console.log('   - email (information personnelle)');
    console.log('   - assurance_rc_professionnelle (document)');
    console.log('   - justificatif_domicile (document)');
    console.log('   - extrait_bce (document)');
    console.log('   - attestation_cotisations_sociales (document)');
    console.log('   - a_permis_conduire (boolean)');
    console.log('   - categorie_permis_conduire (varchar)');
    console.log('   - document_permis_conduire (document)');
    console.log('   - a_permis_chariot (boolean)');
    console.log('   - nombre_permis_chariot (int)');
    console.log('   - document_permis_chariot (document)');
    console.log('📋 Type document étendu: carte_identite, passeport, permis_conduire, titre_sejour');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
