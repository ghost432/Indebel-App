const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function fixTypeFacturation() {
  try {
    console.log('🔧 Mise à jour de type_facturation...');
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../migrations/fix_type_facturation_enum.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Extraire uniquement la requête ALTER TABLE
    const alterQuery = sql.split('\n').find(line => line.trim().startsWith('ALTER TABLE'));
    
    if (alterQuery) {
      await db.query(alterQuery);
      console.log('✅ type_facturation mis à jour avec succès');
      console.log('   Valeurs disponibles: unique, mensuel, trimestriel, semestriel, annuel');
    } else {
      console.error('❌ Requête ALTER TABLE non trouvée dans le fichier SQL');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixTypeFacturation();
