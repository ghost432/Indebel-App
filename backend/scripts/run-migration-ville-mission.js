const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🚀 Ajout de la colonne ville_mission...');

    // Étape 1 : Ajouter colonnes (ignorer erreur si déjà existant)
    try {
      console.log('📝 Ajout de la colonne ville_mission à missions_forfait_horaire...');
      await db.query(`
        ALTER TABLE missions_forfait_horaire 
        ADD COLUMN ville_mission VARCHAR(100) COMMENT 'Ville de la mission extraite de l adresse' 
        AFTER adresse_mission
      `);
      console.log('✅ Colonne ajoutée à missions_forfait_horaire');
    } catch (e) {
      if (e.errno === 1060) {
        console.log('ℹ️ Colonne ville_mission existe déjà dans missions_forfait_horaire');
      } else {
        throw e;
      }
    }

    try {
      console.log('📝 Ajout de la colonne ville_mission à missions_forfait_fixe...');
      await db.query(`
        ALTER TABLE missions_forfait_fixe 
        ADD COLUMN ville_mission VARCHAR(100) COMMENT 'Ville de la mission extraite de l adresse' 
        AFTER adresse_mission
      `);
      console.log('✅ Colonne ajoutée à missions_forfait_fixe');
    } catch (e) {
      if (e.errno === 1060) {
        console.log('ℹ️ Colonne ville_mission existe déjà dans missions_forfait_fixe');
      } else {
        throw e;
      }
    }

    // Étape 2 : Créer index (peut échouer si déjà existant, on ignore l'erreur)
    try {
      console.log('📝 Création de l\'index sur missions_forfait_horaire...');
      await db.query('ALTER TABLE missions_forfait_horaire ADD INDEX idx_missions_horaire_ville (ville_mission)');
      console.log('✅ Index créé sur missions_forfait_horaire');
    } catch (e) {
      console.log('ℹ️ Index déjà existant ou erreur ignorée');
    }

    try {
      console.log('📝 Création de l\'index sur missions_forfait_fixe...');
      await db.query('ALTER TABLE missions_forfait_fixe ADD INDEX idx_missions_fixe_ville (ville_mission)');
      console.log('✅ Index créé sur missions_forfait_fixe');
    } catch (e) {
      console.log('ℹ️ Index déjà existant ou erreur ignorée');
    }

    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Colonne ville_mission ajoutée aux tables missions');
    console.log('📋 Index créés pour améliorer les performances');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
