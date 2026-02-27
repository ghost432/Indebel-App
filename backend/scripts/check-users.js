require('dotenv').config();
const db = require('../config/database');

async function checkUsers() {
  try {
    // Vérifier la structure de la table
    console.log('\n=== STRUCTURE DE LA TABLE USERS ===\n');
    const [columns] = await db.query('DESCRIBE users');
    console.log('Colonnes disponibles:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });

    // Récupérer les utilisateurs
    console.log('\n\n=== UTILISATEURS EXISTANTS ===\n');
    const [users] = await db.query(`
      SELECT id, prenom, nom, email, role, denomination, numero_bce
      FROM users 
      WHERE role IN ('freelancer', 'employer')
      ORDER BY role, id
    `);

    const freelancers = users.filter(u => u.role === 'freelancer');
    const employers = users.filter(u => u.role === 'employer');

    console.log(`\n📊 Total: ${users.length} utilisateurs (${freelancers.length} freelancers, ${employers.length} employers)\n`);

    if (freelancers.length > 0) {
      console.log('=== FREELANCERS ===\n');
      freelancers.forEach(user => {
        const slug = `${user.prenom}-${user.nom}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        console.log(`ID: ${user.id} | ${user.prenom} ${user.nom} (${user.email})`);
        console.log(`  Slug: ${slug}`);
        console.log(`  URL: http://localhost:5175/freelancer/profile/${slug}\n`);
      });
    } else {
      console.log('=== FREELANCERS === (Aucun)\n');
    }

    if (employers.length > 0) {
      console.log('=== EMPLOYERS ===\n');
      employers.forEach(user => {
        const slug = (user.denomination || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        console.log(`ID: ${user.id} | ${user.denomination || 'N/A'} (${user.email})`);
        console.log(`  BCE: ${user.numero_bce || 'N/A'}`);
        console.log(`  Slug: ${slug}`);
        console.log(`  URL: http://localhost:5175/employer/profile/${slug}\n`);
      });
    } else {
      console.log('=== EMPLOYERS === (Aucun)\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkUsers();
