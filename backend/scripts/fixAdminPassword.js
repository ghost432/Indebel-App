const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

console.log('\n═══════════════════════════════════════════════════');
console.log('          RÉPARATION MOT DE PASSE ADMIN');
console.log('═══════════════════════════════════════════════════\n');

// Configuration de la connexion
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

const adminEmail = 'admin@indebel.com';
const newPassword = 'Admin123!@#';

async function fixAdminPassword() {
  try {
    console.log('✅ Connecté à la base de données\n');
    
    // Vérifier que l'admin existe
    connection.query(
      'SELECT id, email, nom FROM users WHERE email = ?',
      [adminEmail],
      async (error, results) => {
        if (error) {
          console.error('❌ Erreur SQL:', error.message);
          connection.end();
          process.exit(1);
        }

        if (results.length === 0) {
          console.log(`❌ Aucun utilisateur trouvé avec l'email: ${adminEmail}`);
          connection.end();
          process.exit(1);
        }

        const admin = results[0];
        console.log('✅ Utilisateur admin trouvé:');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Nom: ${admin.nom}\n`);

        // Hacher le nouveau mot de passe
        console.log('🔐 Hachage du nouveau mot de passe...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(`✅ Hash généré: ${hashedPassword.substring(0, 30)}...\n`);

        // Mettre à jour dans la base de données
        console.log('💾 Mise à jour dans la base de données...');
        connection.query(
          'UPDATE users SET mot_de_passe_hash = ? WHERE id = ?',
          [hashedPassword, admin.id],
          (updateError, updateResults) => {
            if (updateError) {
              console.error('❌ Erreur de mise à jour:', updateError.message);
              connection.end();
              process.exit(1);
            }

            console.log(`✅ Mot de passe mis à jour pour l'utilisateur ID ${admin.id}\n`);

            // Vérifier que le mot de passe fonctionne
            console.log('🧪 Vérification du nouveau mot de passe...');
            connection.query(
              'SELECT mot_de_passe_hash FROM users WHERE id = ?',
              [admin.id],
              async (selectError, selectResults) => {
                if (selectError) {
                  console.error('❌ Erreur de vérification:', selectError.message);
                  connection.end();
                  process.exit(1);
                }

                const storedHash = selectResults[0].mot_de_passe_hash;
                const isValid = await bcrypt.compare(newPassword, storedHash);

                if (isValid) {
                  console.log('✅ Vérification réussie! Le mot de passe fonctionne!\n');
                  console.log('═══════════════════════════════════════════════════');
                  console.log('          CREDENTIALS ADMIN');
                  console.log('═══════════════════════════════════════════════════');
                  console.log(`Email: ${adminEmail}`);
                  console.log(`Mot de passe: ${newPassword}`);
                  console.log('═══════════════════════════════════════════════════\n');
                } else {
                  console.log('❌ Erreur: Le mot de passe ne fonctionne pas après mise à jour!\n');
                }

                connection.end();
                process.exit(0);
              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    connection.end();
    process.exit(1);
  }
}

// Connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  }
  
  fixAdminPassword();
});
