const db = require('./config/database');

async function fixSupportRecommande() {
  try {
    console.log('🔄 Début de la correction des priorités de support...\n');

    // 1. Premium Prestataire : prioritaire 48h → premium 12h
    console.log('📝 Premium Prestataire (ID 11) : prioritaire → premium (12h)...');
    await db.query(`UPDATE forfaits SET priorite_support = 'premium' WHERE id = 11`);
    console.log('✅ Corrigé\n');

    // 2. Gratuit Prestataire : prioritaire 48h → standard 48h
    console.log('📝 Gratuit Prestataire (ID 10) : prioritaire → standard (48h)...');
    await db.query(`UPDATE forfaits SET priorite_support = 'standard' WHERE id = 10`);
    console.log('✅ Corrigé\n');

    // 3. Gratuit Recruteur : prioritaire 48h → standard 48h
    console.log('📝 Gratuit Recruteur : prioritaire → standard (48h)...');
    await db.query(`
      UPDATE forfaits 
      SET priorite_support = 'standard' 
      WHERE type_utilisateur = 'employer' AND prix_mensuel = 0
    `);
    console.log('✅ Corrigé\n');

    // 4. Mettre NULL au lieu de 0 pour recommande
    console.log('📝 Correction du champ recommande (0 → NULL)...');
    const [result] = await db.query(`UPDATE forfaits SET recommande = NULL WHERE recommande = 0`);
    console.log(`✅ ${result.affectedRows} forfaits corrigés\n`);

    // Vérification
    console.log('🔍 Vérification des données...\n');
    const [forfaits] = await db.query(`
      SELECT 
        id,
        nom,
        type_utilisateur,
        priorite_support,
        recommande
      FROM forfaits
      ORDER BY type_utilisateur, id
    `);

    console.log('📊 État des forfaits :');
    console.log('─'.repeat(80));
    forfaits.forEach(f => {
      console.log(`ID ${f.id} | ${f.nom} (${f.type_utilisateur})`);
      console.log(`  Support: ${f.priorite_support}`);
      console.log(`  Recommandé: ${f.recommande ?? 'NULL'}`);
      console.log('─'.repeat(80));
    });

    console.log('\n✅ Correction terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la correction :', error.message);
    process.exit(1);
  }
}

fixSupportRecommande();
