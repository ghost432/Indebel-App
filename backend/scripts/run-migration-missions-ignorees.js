const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration missions ignorées...');

    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, '../migrations/create_missions_ignorees.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Séparer les requêtes SQL
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    // Exécuter chaque requête
    for (const query of queries) {
      console.log('📝 Exécution de la requête...');
      await db.query(query);
      console.log('✅ Requête exécutée avec succès');
    }

    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Table créée: missions_ignorees');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
