const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function addDetailsComplementaires() {
  try {
    console.log('🔧 Ajout de la colonne details_complementaires...');
    
    // Exécuter directement la requête SQL
    await db.query(`
      ALTER TABLE demandes_devis 
      ADD COLUMN details_complementaires TEXT COMMENT 'Détails complémentaires (surface, étage, accès, etc.)'
    `);
    
    console.log('✅ Colonne details_complementaires ajoutée avec succès');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  La colonne details_complementaires existe déjà');
      process.exit(0);
    } else {
      console.error('❌ Erreur:', error.message);
      console.error('Code erreur:', error.code);
      process.exit(1);
    }
  }
}

addDetailsComplementaires();
