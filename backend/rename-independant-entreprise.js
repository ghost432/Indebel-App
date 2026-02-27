const db = require('./config/database');

async function renameTerms() {
  try {
    console.log('🔄 Début du renommage des termes...\n');

    // ============================================
    // 1. TABLE FORFAITS - Noms et descriptions
    // ============================================
    console.log('📝 Mise à jour de la table forfaits...');
    
    // Remplacer "Prestataire" par "Prestataire"
    await db.query(`
      UPDATE forfaits 
      SET nom = REPLACE(REPLACE(REPLACE(REPLACE(nom, 
        'Prestataire', 'Prestataire'),
        'prestataire', 'prestataire'),
        'PRESTATAIRE', 'PRESTATAIRE'),
        'Prestataire', 'Prestataire')
    `);
    
    await db.query(`
      UPDATE forfaits 
      SET description = REPLACE(REPLACE(REPLACE(REPLACE(description, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
    `);
    
    // Remplacer "Recruteur" par "Recruteur"
    await db.query(`
      UPDATE forfaits 
      SET nom = REPLACE(REPLACE(REPLACE(nom, 
        'Recruteur', 'Recruteur'),
        'recruteur', 'recruteur'),
        'RECRUTEUR', 'RECRUTEUR')
    `);
    
    await db.query(`
      UPDATE forfaits 
      SET description = REPLACE(REPLACE(REPLACE(REPLACE(description, 
        'recruteur', 'recruteur'),
        'Recruteur', 'Recruteur'),
        'recruteurs', 'recruteurs'),
        'Recruteurs', 'Recruteurs')
    `);
    
    console.log('✅ Table forfaits mise à jour\n');

    // ============================================
    // 2. TABLE NOTIFICATIONS - Messages
    // ============================================
    console.log('📝 Mise à jour de la table notifications...');
    
    await db.query(`
      UPDATE notifications 
      SET titre = REPLACE(REPLACE(REPLACE(REPLACE(titre, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
    `);
    
    await db.query(`
      UPDATE notifications 
      SET message = REPLACE(REPLACE(REPLACE(REPLACE(message, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
    `);
    
    await db.query(`
      UPDATE notifications 
      SET titre = REPLACE(REPLACE(REPLACE(REPLACE(titre, 
        'recruteur', 'recruteur'),
        'Recruteur', 'Recruteur'),
        'recruteurs', 'recruteurs'),
        'Recruteurs', 'Recruteurs')
    `);
    
    await db.query(`
      UPDATE notifications 
      SET message = REPLACE(REPLACE(REPLACE(REPLACE(message, 
        'recruteur', 'recruteur'),
        'Recruteur', 'Recruteur'),
        'recruteurs', 'recruteurs'),
        'Recruteurs', 'Recruteurs')
    `);
    
    console.log('✅ Table notifications mise à jour\n');

    // ============================================
    // 3. TABLE JOBS - Titres et descriptions
    // ============================================
    console.log('📝 Mise à jour de la table jobs...');
    
    await db.query(`
      UPDATE jobs 
      SET titre = REPLACE(REPLACE(REPLACE(REPLACE(titre, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
      WHERE titre IS NOT NULL
    `);
    
    await db.query(`
      UPDATE jobs 
      SET description = REPLACE(REPLACE(REPLACE(REPLACE(description, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
      WHERE description IS NOT NULL
    `);
    
    console.log('✅ Table jobs mise à jour\n');

    // ============================================
    // 4. TABLE MISSIONS - Titres et descriptions
    // ============================================
    console.log('📝 Mise à jour des tables missions...');
    
    // Missions forfait horaire
    await db.query(`
      UPDATE missions_forfait_horaire 
      SET titre = REPLACE(REPLACE(REPLACE(REPLACE(titre, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
      WHERE titre IS NOT NULL
    `);
    
    await db.query(`
      UPDATE missions_forfait_horaire 
      SET description = REPLACE(REPLACE(REPLACE(REPLACE(description, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
      WHERE description IS NOT NULL
    `);
    
    // Missions forfait fixe
    await db.query(`
      UPDATE missions_forfait_fixe 
      SET titre = REPLACE(REPLACE(REPLACE(REPLACE(titre, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
      WHERE titre IS NOT NULL
    `);
    
    await db.query(`
      UPDATE missions_forfait_fixe 
      SET description = REPLACE(REPLACE(REPLACE(REPLACE(description, 
        'prestataire', 'prestataire'),
        'Prestataire', 'Prestataire'),
        'prestataires', 'prestataires'),
        'Prestataires', 'Prestataires')
      WHERE description IS NOT NULL
    `);
    
    console.log('✅ Tables missions mises à jour\n');

    // ============================================
    // 5. Vérification des résultats
    // ============================================
    console.log('🔍 Vérification des forfaits...\n');
    const [forfaits] = await db.query(`
      SELECT id, nom, type_utilisateur 
      FROM forfaits 
      ORDER BY type_utilisateur, id
    `);
    
    console.log('📊 Forfaits après modification :');
    console.log('─'.repeat(80));
    forfaits.forEach(f => {
      console.log(`ID ${f.id} | ${f.nom} (${f.type_utilisateur})`);
    });
    console.log('─'.repeat(80));

    console.log('\n✅ Renommage terminé avec succès !');
    console.log('\n📋 Résumé des modifications :');
    console.log('   • "Prestataire" → "Prestataire"');
    console.log('   • "prestataires" → "prestataires"');
    console.log('   • "Recruteur" → "Recruteur"');
    console.log('   • "recruteurs" → "recruteurs"');
    console.log('\n🔄 Redémarrez le backend pour appliquer les changements.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du renommage :', error.message);
    console.error(error);
    process.exit(1);
  }
}

renameTerms();
