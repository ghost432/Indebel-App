const db = require('./config/database');

async function fixZeros() {
  try {
    console.log('🔄 Début de la correction des zéros parasites...\n');

    // Gratuit Prestataire (ID 10)
    console.log('📝 Correction du forfait "Gratuit Prestataire" (ID 10)...');
    await db.query(`
      UPDATE forfaits 
      SET 
        logo_page_accueil = NULL,
        gestion_candidatures = NULL,
        badge_premium = NULL,
        mise_en_avant = NULL,
        statistiques_avancees = NULL,
        api_access = NULL,
        duree_offre_jours = NULL
      WHERE id = 10
    `);
    console.log('✅ Forfait ID 10 corrigé\n');

    // Premium Prestataire (ID 11)
    console.log('📝 Correction du forfait "Premium Prestataire" (ID 11)...');
    await db.query(`
      UPDATE forfaits 
      SET 
        logo_page_accueil = NULL,
        gestion_candidatures = NULL,
        api_access = NULL,
        duree_offre_jours = NULL
      WHERE id = 11
    `);
    console.log('✅ Forfait ID 11 corrigé\n');

    // Premium+ Prestataire (ID 12)
    console.log('📝 Correction du forfait "Premium+ Prestataire" (ID 12)...');
    await db.query(`
      UPDATE forfaits 
      SET 
        logo_page_accueil = NULL,
        gestion_candidatures = NULL,
        duree_offre_jours = NULL
      WHERE id = 12
    `);
    console.log('✅ Forfait ID 12 corrigé\n');

    // Vérification
    console.log('🔍 Vérification des données après correction...\n');
    const [forfaits] = await db.query(`
      SELECT 
        id,
        nom,
        max_missions,
        duree_abonnement_mois,
        duree_offre_jours,
        logo_page_accueil,
        gestion_candidatures,
        badge_premium,
        mise_en_avant,
        statistiques_avancees,
        api_access
      FROM forfaits
      WHERE type_utilisateur IN ('freelancer', 'les_deux')
      ORDER BY id
    `);

    console.log('📊 État des forfaits freelancer :');
    console.log('─'.repeat(80));
    forfaits.forEach(f => {
      console.log(`ID ${f.id} | ${f.nom}`);
      console.log(`  Max missions: ${f.max_missions || 'illimité'}`);
      console.log(`  Durée abonnement: ${f.duree_abonnement_mois || 'aucune'} mois`);
      console.log(`  Durée offre: ${f.duree_offre_jours || 'NULL'} jours`);
      console.log(`  Logo page accueil: ${f.logo_page_accueil ?? 'NULL'}`);
      console.log(`  Gestion candidatures: ${f.gestion_candidatures ?? 'NULL'}`);
      console.log(`  Badge premium: ${f.badge_premium ?? 'NULL'}`);
      console.log(`  Mise en avant: ${f.mise_en_avant ?? 'NULL'}`);
      console.log(`  Statistiques avancées: ${f.statistiques_avancees ?? 'NULL'}`);
      console.log(`  Accès API: ${f.api_access ?? 'NULL'}`);
      console.log('─'.repeat(80));
    });

    console.log('\n✅ Correction terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la correction :', error.message);
    process.exit(1);
  }
}

fixZeros();
