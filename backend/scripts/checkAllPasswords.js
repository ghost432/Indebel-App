require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAllPasswords() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indebel'
    });

    console.log('✅ Connecté à la base de données\n');

    const [users] = await connection.query(
      'SELECT id, email, mot_de_passe_hash FROM users ORDER BY id ASC'
    );

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('         VÉRIFICATION DES MOTS DE PASSE HACHÉS                 ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    let hashedCount = 0;
    let plainCount = 0;
    const plainPasswordUsers = [];

    users.forEach((user, index) => {
      const isHashed = user.mot_de_passe_hash.startsWith('$2a$') || 
                       user.mot_de_passe_hash.startsWith('$2b$');
      
      console.log(`[${index + 1}] ID ${user.id} - ${user.email}`);
      
      if (isHashed) {
        console.log(`    ✅ Mot de passe haché correctement`);
        console.log(`    Hash: ${user.mot_de_passe_hash.substring(0, 30)}...\n`);
        hashedCount++;
      } else {
        console.log(`    ❌ MOT DE PASSE EN CLAIR: "${user.mot_de_passe_hash}"`);
        console.log(`    ⚠️  ALERTE SÉCURITÉ - Ce mot de passe doit être haché!\n`);
        plainCount++;
        plainPasswordUsers.push({
          id: user.id,
          email: user.email,
          password: user.mot_de_passe_hash
        });
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                        RÉSUMÉ                                  ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Total d'utilisateurs: ${users.length}`);
    console.log(`✅ Mots de passe hachés: ${hashedCount}`);
    console.log(`❌ Mots de passe en clair: ${plainCount}\n`);

    if (plainCount > 0) {
      console.log('⚠️  UTILISATEURS AVEC MOTS DE PASSE EN CLAIR:');
      plainPasswordUsers.forEach(user => {
        console.log(`   - ID ${user.id}: ${user.email} (mot de passe: "${user.password}")`);
      });
      console.log('\n❌ ACTION REQUISE: Hacher les mots de passe en clair!\n');
    } else {
      console.log('✅ TOUS LES MOTS DE PASSE SONT CORRECTEMENT HACHÉS!\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAllPasswords();
