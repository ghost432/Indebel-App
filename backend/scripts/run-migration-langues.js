require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🔄 Exécution de la migration pour ajouter langues_parlees...\n');
    
    // Vérifier si la colonne existe déjà
    const [existingColumns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'langues_parlees'
    `);
    
    if (existingColumns.length > 0) {
      console.log('ℹ️  La colonne langues_parlees existe déjà\n');
    } else {
      const migrationPath = path.join(__dirname, '../migrations/add-langues-parlees.sql');
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await db.query(sql);
      console.log('✅ Colonne langues_parlees ajoutée avec succès\n');
    }
    
    // Mettre à jour les utilisateurs existants avec des langues par défaut
    await db.query(`
      UPDATE users 
      SET langues_parlees = JSON_ARRAY('Français') 
      WHERE (langues_parlees IS NULL OR JSON_LENGTH(langues_parlees) = 0) 
      AND role IN ('freelancer', 'employer')
    `);
    
    console.log('✅ Utilisateurs mis à jour avec langues par défaut\n');
    
    // Vérifier le résultat
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'langues_parlees'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Colonne langues_parlees créée:', columns[0]);
    }
    
    // Afficher les utilisateurs mis à jour
    const [users] = await db.query(`
      SELECT id, prenom, nom, email, role, langues_parlees
      FROM users
      WHERE role IN ('freelancer', 'employer')
    `);
    
    console.log('\n📋 Utilisateurs mis à jour:');
    users.forEach(user => {
      console.log(`  ${user.id}: ${user.prenom || ''} ${user.nom || ''} (${user.role})`);
      console.log(`    Langues: ${user.langues_parlees || 'NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

runMigration();
