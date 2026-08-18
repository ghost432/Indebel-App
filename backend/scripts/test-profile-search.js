require('dotenv').config();
const db = require('../config/database');

async function testProfileSearch() {
  try {
    const identifier = 'jean-luc';
    
    console.log(`\n🔍 Test de recherche pour: "${identifier}"\n`);
    
    // Test 1: Recherche par ID
    console.log('Test 1: Recherche par ID numérique');
    if (/^\d+$/.test(identifier)) {
      console.log('  ✓ Est un ID numérique');
    } else {
      console.log('  ✗ N\'est pas un ID numérique');
    }
    
    // Test 2: Recherche par slug
    console.log('\nTest 2: Recherche par slug (prenom-nom)');
    const query = `
      SELECT 
        id, prenom, nom, email, role, denomination
      FROM users 
      WHERE LOWER(CONCAT(prenom, '-', nom)) = LOWER(?)
      OR LOWER(CONCAT(prenom, ' ', nom)) = LOWER(?)
    `;
    const denominationSearch = identifier.replace(/-/g, ' ');
    const [results] = await db.query(query, [identifier, denominationSearch]);
    
    console.log(`  Recherche avec: "${identifier}" et "${denominationSearch}"`);
    console.log(`  Résultats trouvés: ${results.length}`);
    
    if (results.length > 0) {
      console.log('\n✅ Profil trouvé:');
      results.forEach(user => {
        console.log(`  ID: ${user.id}`);
        console.log(`  Nom: ${user.prenom} ${user.nom}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
      });
    } else {
      console.log('\n❌ Aucun profil trouvé');
      
      // Afficher tous les freelancers pour debug
      console.log('\n📋 Tous les freelancers disponibles:');
      const [allFreelancers] = await db.query(`
        SELECT id, prenom, nom, 
               CONCAT(prenom, '-', nom) as slug_concat,
               LOWER(CONCAT(prenom, '-', nom)) as slug_lower
        FROM users 
        WHERE role = 'freelancer'
      `);
      allFreelancers.forEach(u => {
        console.log(`  ${u.id}: ${u.prenom} ${u.nom}`);
        console.log(`    slug_concat: "${u.slug_concat}"`);
        console.log(`    slug_lower: "${u.slug_lower}"`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testProfileSearch();
