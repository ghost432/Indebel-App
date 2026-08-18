const mysql = require('mysql2');
require('dotenv').config();

console.log('🔍 Testing database connection...');
console.log('📊 Configuration:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_PORT:', process.env.DB_PORT || 3306);
console.log('');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('❌ ERREUR DE CONNEXION:');
    console.error('   Message:', err.message);
    console.error('   Code:', err.code);
    console.error('   Errno:', err.errno);
    console.error('');
    console.error('💡 Solutions possibles:');
    console.error('   1. Vérifier que MySQL est démarré: systemctl status mysql');
    console.error('   2. Vérifier le nom de la base de données dans .env (indebel_bd ou indebel_db?)');
    console.error('   3. Vérifier les identifiants (DB_USER et DB_PASSWORD)');
    console.error('   4. Créer la base si elle n\'existe pas: mysql -u root -proot -e "CREATE DATABASE indebel_bd;"');
    process.exit(1);
  }
  
  console.log('✅ CONNEXION RÉUSSIE!');
  console.log('');
  
  // Test query
  connection.query('SELECT COUNT(*) as count FROM users', (err, results) => {
    if (err) {
      console.error('❌ Erreur lors de la requête:', err.message);
    } else {
      console.log('📊 Nombre d\'utilisateurs dans la base:', results[0].count);
    }
    connection.end();
    console.log('✅ Test terminé avec succès!');
  });
});
