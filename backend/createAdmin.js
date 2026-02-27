const bcrypt = require('bcryptjs')
const db = require('./config/database')

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('Mot-de-passe47', 10)
    
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      ['noreply@indebel.be']
    )

    if (existing.length > 0) {
      console.log('⚠️ Admin existe déjà')
      process.exit(0)
    }

    await db.query(
      'INSERT INTO users (nom, email, mot_de_passe_hash, role, date_creation) VALUES (?, ?, ?, ?, NOW())',
      ['Admin Indebel', 'noreply@indebel.be', hashedPassword, 'admin']
    )
    
    console.log('✅ Admin créé avec succès')
    console.log('📧 Email: noreply@indebel.be')
    console.log('🔑 Password: Mot-de-passe47')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

createAdmin()
