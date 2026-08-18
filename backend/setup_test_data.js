require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const hash = await bcrypt.hash('Password123!', 10);
  
  // Try to create freelancer or get existing
  let freelancerId;
  const [existingFreelancer] = await db.query('SELECT id FROM users WHERE email = ?', ['ulrichthierry47@gmail.com']);
  if (existingFreelancer.length > 0) {
    freelancerId = existingFreelancer[0].id;
    await db.query('UPDATE users SET mot_de_passe_hash = ? WHERE id = ?', [hash, freelancerId]);
  } else {
    let [resFreelancer] = await db.query('INSERT INTO users (email, mot_de_passe_hash, role, prenom, nom, email_verified, statut_verification) VALUES (?, ?, ?, ?, ?, ?, ?)', ['ulrichthierry47@gmail.com', hash, 'freelancer', 'Ulrich', 'FreelancerTest', 1, 'verifie']);
    freelancerId = resFreelancer.insertId;
  }
  
  // Create demande_devis
  let [resDevis] = await db.query('INSERT INTO demandes_devis (prenom, nom, email, telephone, code_postal, ville, type_travaux, description, statut, date_validation, categorie) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)', ['Thierry', 'ClientTest', 'mounchilithierry432@gmail.com', '+32470000000', '1000', 'Bruxelles', 'Peinture intérieure complète', 'Peinture de 3 chambres et 1 salon. Surface 100m2.', 'valide', 'Rénovation & Construction']);
  const demandeId = resDevis.insertId;
  
  console.log('Setup complete!');
  console.log('Demande ID:', demandeId);
  console.log('Freelancer ID:', freelancerId);
  process.exit(0);
}
run();
