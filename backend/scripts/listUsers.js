require('dotenv').config();
const mysql = require('mysql2/promise');

async function listUsers() {
  let connection;
  
  try {
    // Créer la connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indebel'
    });

    console.log('✅ Connecté à la base de données\n');

    // Récupérer tous les utilisateurs avec leurs informations essentielles
    const [users] = await connection.query(`
      SELECT 
        id,
        email,
        mot_de_passe_hash,
        prenom,
        nom,
        denomination,
        role,
        forfait_statut,
        email_verified,
        date_creation
      FROM users
      ORDER BY id ASC
    `);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    LISTE DES UTILISATEURS                      ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé dans la base de données.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n[${index + 1}] ─────────────────────────────────────────────────────`);
        console.log(`ID:           ${user.id}`);
        console.log(`Email:        ${user.email}`);
        console.log(`Mot de passe: ${user.mot_de_passe_hash}`);
        console.log(`Nom:          ${user.prenom || ''} ${user.nom || ''}`);
        if (user.denomination) {
          console.log(`Dénomination: ${user.denomination}`);
        }
        console.log(`Rôle:         ${user.role}`);
        console.log(`Forfait:      ${user.forfait_statut || 'N/A'}`);
        console.log(`Email vérifié: ${user.email_verified ? 'Oui' : 'Non'}`);
        console.log(`Créé le:      ${user.date_creation}`);
      });

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log(`Total: ${users.length} utilisateur(s)\n`);

      // Compter par rôle
      const roleCount = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      console.log('Répartition par rôle:');
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`  - ${role}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nVérifiez vos identifiants de base de données dans le fichier .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nLe serveur MySQL n\'est pas accessible. Vérifiez qu\'il est démarré.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
listUsers();
