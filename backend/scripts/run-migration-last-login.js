const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration last_login...');

    const migrationPath = path.join(__dirname, '../migrations/add_last_login_users.sql');
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
    console.log('📋 Colonne ajoutée: last_login dans users');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
