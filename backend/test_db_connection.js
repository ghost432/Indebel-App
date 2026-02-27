const mysql = require('mysql2');

// Configuration avec les identifiants fournis par l'utilisateur
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'indebel_bd'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connexion réussie à la base de données!');
  
  // Test: Compter les demandes
  connection.query('SELECT COUNT(*) as total FROM demandes_missions', (err, results) => {
    if (err) {
      console.error('❌ Erreur requête:', err.message);
    } else {
      console.log(`📊 Nombre de demandes: ${results[0].total}`);
    }
    
    // Test: Compter les missions
    connection.query('SELECT COUNT(*) as total FROM missions_forfait_horaire UNION ALL SELECT COUNT(*) FROM missions_forfait_fixe', (err, results) => {
      if (err) {
        console.error('❌ Erreur requête missions:', err.message);
      } else {
        const totalMissions = results.reduce((sum, row) => sum + row.total, 0);
        console.log(`🎯 Nombre de missions: ${totalMissions}`);
      }
      
      connection.end();
    });
  });
});
