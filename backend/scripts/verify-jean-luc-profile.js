require('dotenv').config();
const db = require('../config/database');

async function verifyProfile() {
  try {
    console.log('\n🔍 Vérification du profil de Jean Luc...\n');
    
    const [users] = await db.query(`
      SELECT 
        id, prenom, nom, email, role, 
        numero_bce, denomination, adresse, secteur,
        competences, langues_parlees, experience, 
        tarif_journalier, disponibilite, portfolio_url,
        telephone, verification_statut,
        photo_profil, image_couverture
      FROM users 
      WHERE prenom = 'Jean' AND nom = 'Luc'
    `);
    
    if (users.length === 0) {
      console.log('❌ Utilisateur Jean Luc non trouvé');
      process.exit(1);
    }
    
    const user = users[0];
    
    console.log('✅ Utilisateur trouvé\n');
    console.log('=== INFORMATIONS DE BASE ===');
    console.log(`ID: ${user.id}`);
    console.log(`Nom complet: ${user.prenom} ${user.nom}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Statut vérification: ${user.verification_statut || 'NULL'}`);
    
    console.log('\n=== INFORMATIONS PROFESSIONNELLES ===');
    console.log(`Numéro BCE: ${user.numero_bce || '❌ MANQUANT'}`);
    console.log(`Dénomination: ${user.denomination || '❌ MANQUANT'}`);
    console.log(`Adresse: ${user.adresse || '❌ MANQUANT'}`);
    console.log(`Secteur: ${user.secteur || '❌ MANQUANT'}`);
    console.log(`Expérience: ${user.experience ? user.experience + ' ans' : '❌ MANQUANT'}`);
    console.log(`Tarif journalier: ${user.tarif_journalier ? user.tarif_journalier + '€' : '❌ MANQUANT'}`);
    console.log(`Disponibilité: ${user.disponibilite || '❌ MANQUANT'}`);
    console.log(`Portfolio: ${user.portfolio_url || 'Non renseigné'}`);
    console.log(`Téléphone: ${user.telephone || 'Non renseigné'}`);
    
    console.log('\n=== COMPÉTENCES ET LANGUES ===');
    console.log(`Compétences: ${user.competences || '❌ MANQUANT'}`);
    console.log(`Langues parlées: ${user.langues_parlees || '❌ MANQUANT'}`);
    
    console.log('\n=== PROFIL VISUEL ===');
    console.log(`Photo de profil: ${user.photo_profil ? 'Définie' : 'Non définie'}`);
    console.log(`Image de couverture: ${user.image_couverture ? 'Définie' : 'Non définie'}`);
    
    console.log('\n=== URL DU PROFIL PUBLIC ===');
    const slug = `${user.prenom}-${user.nom}`.toLowerCase().replace(/\s+/g, '-');
    console.log(`http://localhost:5176/freelancer/profile/${slug}`);
    console.log(`http://localhost:5176/freelancer/profile/${user.id}`);
    
    // Vérifier ce qui manque
    const missing = [];
    if (!user.numero_bce) missing.push('Numéro BCE');
    if (!user.denomination) missing.push('Dénomination');
    if (!user.adresse) missing.push('Adresse');
    if (!user.secteur) missing.push('Secteur');
    if (!user.competences || user.competences === 'null') missing.push('Compétences');
    
    if (missing.length > 0) {
      console.log('\n⚠️  INFORMATIONS MANQUANTES:');
      missing.forEach(item => console.log(`  - ${item}`));
      console.log('\nCes informations devraient être complétées lors de l\'inscription.');
    } else {
      console.log('\n✅ Toutes les informations essentielles sont présentes !');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

verifyProfile();
