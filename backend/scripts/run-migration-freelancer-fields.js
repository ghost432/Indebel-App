const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration des champs freelancer...');

    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, '../migrations/add_freelancer_profile_fields.sql');
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
    console.log('  - a_propos (TEXT) : Description "À propos de vous"');
    console.log('  - genre (ENUM) : Genre (homme, femme, autre, non_specifie)');
    console.log('  - tranche_age (ENUM) : Tranche d\'âge (18-25, 26-35, 36-45, 46-55, 56+)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
