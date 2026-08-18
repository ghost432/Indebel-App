const fs = require('fs')
const path = require('path')
const db = require('./config/database')

const runMigration = async () => {
  try {
    console.log('🔄 Démarrage de la migration...')

    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, 'migrations', 'add_user_fields.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Séparer les commandes SQL (par point-virgule)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'))

    // Exécuter chaque commande
    for (const command of commands) {
      if (command) {
        try {
          await db.query(command)
          console.log('✅ Commande exécutée:', command.substring(0, 50) + '...')
        } catch (error) {
          // Ignorer les erreurs "column already exists"
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === '42701') {
            console.log('⚠️  Colonne existe déjà, ignoré')
          } else {
            throw error
          }
        }
      }
    }

    console.log('✅ Migration terminée avec succès!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message)
    process.exit(1)
  }
}

runMigration()
