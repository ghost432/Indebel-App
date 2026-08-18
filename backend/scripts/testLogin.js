require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testLogin(email, password) {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indebel'
    });

    console.log('✅ Connecté à la base de données\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    TEST DE CONNEXION                           ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Email: ${email}`);
    console.log(`Mot de passe: ${password}\n`);

    // Récupérer l'utilisateur
    const [users] = await connection.query(
      'SELECT id, email, nom, prenom, mot_de_passe_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ ÉCHEC: Utilisateur non trouvé\n');
      return false;
    }

    const user = users[0];
    console.log('✅ Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nom: ${user.prenom} ${user.nom}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Hash: ${user.mot_de_passe_hash}\n`);

    // Vérifier le mot de passe
    console.log('🔐 Vérification du mot de passe...');
    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe_hash);

    if (isPasswordValid) {
      console.log('✅ MOT DE PASSE VALIDE - CONNEXION RÉUSSIE!\n');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ TEST DE CONNEXION RÉUSSI');
      console.log('═══════════════════════════════════════════════════════════════\n');
      return true;
    } else {
      console.log('❌ MOT DE PASSE INVALIDE - CONNEXION ÉCHOUÉE!\n');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('❌ TEST DE CONNEXION ÉCHOUÉ');
      console.log('═══════════════════════════════════════════════════════════════\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Test avec tous les utilisateurs
async function testAllUsers() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('          TEST DE TOUS LES UTILISATEURS                        ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const testCases = [
    { email: 'mounchilithierry432@gmail.com', password: 'Root@4747', description: 'Employer (mot de passe réparé)' },
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Test: ${testCase.description}`);
    console.log('─────────────────────────────────────────────────────────────\n');
    await testLogin(testCase.email, testCase.password);
    console.log('\n');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('               TOUS LES TESTS SONT TERMINÉS                    ');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Si un email et mot de passe sont fournis en arguments, tester seulement celui-là
const args = process.argv.slice(2);
if (args.length >= 2) {
  const email = args[0];
  const password = args[1];
  testLogin(email, password);
} else {
  testAllUsers();
}
