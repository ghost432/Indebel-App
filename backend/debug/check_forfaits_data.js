const db = require('../config/database');

async function checkForfaitsData() {
  try {
    console.log('🔍 Vérification des données forfaits...\n');
    
    // Récupérer tous les forfaits
    const [forfaits] = await db.query('SELECT * FROM forfaits WHERE actif = TRUE ORDER BY prix_mensuel ASC');
    
    console.log(`📊 Nombre de forfaits actifs: ${forfaits.length}\n`);
    
    forfaits.forEach((forfait, index) => {
      console.log(`--- Forfait ${index + 1}: ${forfait.nom} ---`);
      console.log(`ID: ${forfait.id}`);
      console.log(`Prix mensuel: ${forfait.prix_mensuel}€`);
      console.log(`Type utilisateur: ${forfait.type_utilisateur}`);
      console.log(`Max missions: ${forfait.max_missions || 'Illimité'}`);
      console.log(`Badge premium: ${forfait.badge_premium}`);
      console.log(`Mise en avant: ${forfait.mise_en_avant}`);
      console.log(`Statistiques avancées: ${forfait.statistiques_avancees}`);
      console.log(`API Access: ${forfait.api_access}`);
      console.log(`Support: ${forfait.priorite_support}`);
      console.log(`Label Indebel: ${forfait.label_indebel || 'Non défini'}`);
      console.log(`Gestion candidatures: ${forfait.gestion_candidatures || 'Non défini'}`);
      console.log(`Logo page accueil: ${forfait.logo_page_accueil || 'Non défini'}`);
      console.log(`Couleur: ${forfait.couleur_badge}`);
      
      // Calcul TVA pour vérification
      const prixHT = parseFloat(forfait.prix_mensuel);
      const tva = prixHT * 0.21;
      const prixTTC = prixHT + tva;
      
      console.log(`💰 Calculs:`);
      console.log(`  Prix HT: ${prixHT.toFixed(2)}€`);
      console.log(`  TVA (21%): ${tva.toFixed(2)}€`);
      console.log(`  Prix TTC: ${prixTTC.toFixed(2)}€`);
      console.log('');
    });
    
    console.log('✅ Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

checkForfaitsData();
