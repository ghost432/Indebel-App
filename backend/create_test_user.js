const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUser() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'indebel_user',
      password: 'indebel_pass',
      database: 'indebel_bd'
    });

    const hash = await bcrypt.hash('password123', 10);
    const email = 'test.freelancer@indebel.be';

    // check if exists
    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log('User already exists, updating status to non_verifie');
      await connection.execute('UPDATE users SET statut_verification = "non_verifie" WHERE email = ?', [email]);
    } else {
      console.log('Creating user...');
      await connection.execute(`
        INSERT INTO users (nom, prenom, email, mot_de_passe_hash, role, statut_verification)
        VALUES ('Test', 'Freelancer', ?, ?, 'freelancer', 'non_verifie')
      `, [email, hash]);
      console.log('User created!');
    }
    
    await connection.end();
  } catch (err) {
    console.error(err);
  }
}
createUser();
