const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createAdmin() {
  try {
    // Vérifier si un admin existe déjà
    const [existingAdmin] = await db.query(
      'SELECT * FROM users WHERE email = ? OR role = "admin" LIMIT 1',
      ['admin@indebel.be']
    );

    if (existingAdmin.length > 0) {
      console.log('✅ Un utilisateur admin existe déjà:', existingAdmin[0].email);
      return;
    }

    // Créer un mot de passe haché
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Insérer l'admin
    const [result] = await db.query(
      `INSERT INTO users (
        nom, prenom, email, mot_de_passe, role, 
        telephone, adresse, pays_code, 
        statut_compte, email_verifie,
        accepte_cgu, accepte_notifications, accepte_emails,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        'Admin',
        'Indebel', 
        'admin@indebel.be',
        hashedPassword,
        'admin',
        '+32123456789',
        'Bruxelles, Belgique',
        'BE',
        'active',
        1,
        1,
        1,
        1
      ]
    );

    console.log('✅ Admin créé avec succès!');
    console.log('📧 Email: admin@indebel.be');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID:', result.insertId);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
