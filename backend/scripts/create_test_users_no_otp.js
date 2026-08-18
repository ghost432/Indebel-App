const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function createTestUsers() {
  try {
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const bypassDate = new Date('2030-01-01');

    // 1. Prestataire (Freelancer)
    const freelancerEmail = 'test.freelancer@indebel.be';
    const [existingFreelancer] = await db.query('SELECT id FROM users WHERE email = ?', [freelancerEmail]);
    
    if (existingFreelancer.length === 0) {
      await db.query(
        `INSERT INTO users (
          nom, prenom, email, email_verified, mot_de_passe_hash, role,
          statut_verification, otp_bypass_until, forfait_id, forfait_date_debut, forfait_statut,
          accepte_cgu, accepte_notifications, accepte_emails
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
        [
          'Test', 'Freelancer', freelancerEmail, true, hashedPassword, 'freelancer',
          'verifie', bypassDate, 1, 'actif',
          true, true, true
        ]
      );
      console.log('✅ Prestataire test créé: ' + freelancerEmail);
    } else {
      await db.query('UPDATE users SET otp_bypass_until = ? WHERE email = ?', [bypassDate, freelancerEmail]);
      console.log('🔄 Prestataire test mis à jour: ' + freelancerEmail);
    }

    // 2. Recruteur (Employer)
    const employerEmail = 'test.employer@indebel.be';
    const [existingEmployer] = await db.query('SELECT id FROM users WHERE email = ?', [employerEmail]);
    
    if (existingEmployer.length === 0) {
      await db.query(
        `INSERT INTO users (
          nom, prenom, email, email_verified, mot_de_passe_hash, role,
          statut_verification, otp_bypass_until, forfait_id, forfait_date_debut, forfait_statut,
          accepte_cgu, accepte_notifications, accepte_emails, denomination
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
        [
          'Test', 'Employer', employerEmail, true, hashedPassword, 'employer',
          'verifie', bypassDate, 4, 'actif',
          true, true, true, 'Test Company'
        ]
      );
      console.log('✅ Recruteur test créé: ' + employerEmail);
    } else {
      await db.query('UPDATE users SET otp_bypass_until = ? WHERE email = ?', [bypassDate, employerEmail]);
      console.log('🔄 Recruteur test mis à jour: ' + employerEmail);
    }

    console.log('\n--- Informations de connexion ---');
    console.log('Mot de passe pour les deux: ' + password);
    console.log('Freelancer : ' + freelancerEmail);
    console.log('Employer : ' + employerEmail);
    console.log('Les deux comptes n\'auront pas besoin d\'OTP (contournement actif).');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création des utilisateurs:', error);
    process.exit(1);
  }
}

createTestUsers();
