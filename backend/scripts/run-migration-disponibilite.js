const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration disponibilité...');

    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, '../migrations/update_freelancer_disponibilite.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Séparer les requêtes SQL
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    // Exécuter chaque requête
    for (const query of queries) {
      if (query.toLowerCase().includes('alter table')) {
        console.log('📝 Exécution de la requête ALTER TABLE...');
        await db.query(query);
        console.log('✅ Requête exécutée avec succès');
      }
    }

    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Champs ajoutés:');
    console.log('  - disponibilite_debut (DATE) : Date de début de disponibilité');
    console.log('  - disponibilite_fin (DATE) : Date de fin de disponibilité');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
