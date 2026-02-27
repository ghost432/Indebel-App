const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Correction de la colonne de vérification...');

    const migrationPath = path.join(__dirname, '../migrations/fix_verification_column.sql');
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
    console.log('📋 Ancienne colonne verification_statut supprimée');
    console.log('📋 Utilisation uniquement de statut_verification maintenant');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
