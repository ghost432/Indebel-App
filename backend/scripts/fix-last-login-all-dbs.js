const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixLastLogin() {
  let connection;
  
  try {
    console.log('🔧 Correction de la colonne last_login dans toutes les bases...');
    
    // Connexion sans sélectionner de base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connexion établie');

    // Lister les bases de données indebel
    const [databases] = await connection.query(
      "SHOW DATABASES LIKE 'indebel%'"
    );

    console.log(`📋 Bases de données trouvées: ${databases.length}`);

    for (const db of databases) {
      const dbName = Object.values(db)[0];
      console.log(`\n🔨 Traitement de: ${dbName}`);

      try {
        // Utiliser cette base de données
        await connection.query(`USE ${dbName}`);

        // Vérifier si la colonne existe déjà
        const [columns] = await connection.query(
          `SHOW COLUMNS FROM users LIKE 'last_login'`
        );

        if (columns.length === 0) {
          console.log(`  ➕ Ajout de la colonne last_login...`);
          
          // Ajouter la colonne
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN last_login TIMESTAMP NULL 
            COMMENT 'Date de dernière connexion'
          `);

          // Mettre à jour les utilisateurs existants
          await connection.query(`
            UPDATE users 
            SET last_login = NOW() 
            WHERE last_login IS NULL
          `);

          console.log(`  ✅ Colonne ajoutée avec succès`);
        } else {
          console.log(`  ℹ️  Colonne déjà existante`);
        }
      } catch (error) {
        console.error(`  ❌ Erreur sur ${dbName}:`, error.message);
      }
    }

    console.log('\n✅ Traitement terminé pour toutes les bases de données !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Connexion fermée');
    }
  }
}

fixLastLogin();
