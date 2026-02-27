require('dotenv').config();
const db = require('../config/database');

async function getUsers() {
  try {
    const [users] = await db.query(`
      SELECT 
        id, prenom, nom, email, role, denomination, numero_bce,
        adresse, secteur, telephone, poste, experience,
        tarif_journalier, disponibilite, description_recruteur,
        site_web, taille_recruteur, competences, competences_recherchees,
        langues_parlees, photo_profil, image_couverture, portfolio_url
      FROM users 
      WHERE role IN ('freelancer', 'employer')
      ORDER BY role, id
    `);

    console.log('\n=== UTILISATEURS EXISTANTS ===\n');
    
    const freelancers = users.filter(u => u.role === 'freelancer');
    const employers = users.filter(u => u.role === 'employer');

    console.log(`\n📊 Total: ${users.length} utilisateurs (${freelancers.length} freelancers, ${employers.length} employers)\n`);

    console.log('=== FREELANCERS ===\n');
    freelancers.forEach(user => {
      const slug = `${user.prenom}-${user.nom}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      console.log(`ID: ${user.id}`);
      console.log(`Nom: ${user.prenom} ${user.nom}`);
      console.log(`Email: ${user.email}`);
      console.log(`Poste: ${user.poste || 'N/A'}`);
      console.log(`Expérience: ${user.experience ? user.experience + ' ans' : 'N/A'}`);
      console.log(`Tarif: ${user.tarif_journalier ? user.tarif_journalier + '€/jour' : 'N/A'}`);
      console.log(`Disponibilité: ${user.disponibilite || 'N/A'}`);
      console.log(`URL: http://localhost:5175/freelancer/profile/${slug}`);
      console.log(`URL (ID): http://localhost:5175/freelancer/profile/${user.id}`);
      console.log('---');
    });

    console.log('\n=== EMPLOYERS ===\n');
    employers.forEach(user => {
      const slug = (user.denomination || `user-${user.id}`).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      console.log(`ID: ${user.id}`);
      console.log(`Dénomination: ${user.denomination || 'N/A'}`);
      console.log(`BCE: ${user.numero_bce || 'N/A'}`);
      console.log(`Email: ${user.email}`);
      console.log(`Secteur: ${user.secteur || 'N/A'}`);
      console.log(`URL: http://localhost:5175/employer/profile/${slug}`);
      console.log(`URL (ID): http://localhost:5175/employer/profile/${user.id}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

getUsers();
