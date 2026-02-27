require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function fixPasswordUser9() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indebel'
    });

    console.log('✅ Connecté à la base de données\n');

    // Récupérer l'utilisateur ID 9
    const [users] = await connection.query(
      'SELECT id, email, mot_de_passe_hash FROM users WHERE id = ?',
      [9]
    );

    if (users.length === 0) {
      console.log('❌ Utilisateur ID 9 non trouvé');
      return;
    }

    const user = users[0];
    console.log('📋 Utilisateur trouvé:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Mot de passe actuel: ${user.mot_de_passe_hash}\n`);

    // Vérifier si c'est bien un mot de passe en clair
    if (user.mot_de_passe_hash.startsWith('$2a$') || user.mot_de_passe_hash.startsWith('$2b$')) {
      console.log('✅ Le mot de passe est déjà haché correctement.');
      return;
    }

    console.log('⚠️  Mot de passe en clair détecté. Hashage en cours...\n');

    // Le mot de passe en clair est "Root@4747"
    const plainPassword = user.mot_de_passe_hash; // Garder l'ancien pour référence
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log('🔐 Nouveau hash généré:');
    console.log(`   ${hashedPassword}\n`);

    // Mettre à jour dans la base de données
    await connection.query(
      'UPDATE users SET mot_de_passe_hash = ? WHERE id = ?',
      [hashedPassword, 9]
    );

    console.log('✅ Mot de passe mis à jour avec succès!\n');

    // Vérifier que le hash fonctionne
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('🧪 Test de vérification du hash:');
    console.log(`   Mot de passe: "${plainPassword}"`);
    console.log(`   Comparaison: ${isValid ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);

    if (isValid) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ CORRECTION TERMINÉE AVEC SUCCÈS');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('\nL\'utilisateur peut maintenant se connecter avec:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Mot de passe: ${plainPassword}`);
      console.log('═══════════════════════════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixPasswordUser9();
