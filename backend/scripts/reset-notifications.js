const db = require('../config/database');

async function resetNotifications() {
  try {
    console.log('🔄 Réinitialisation du système de notifications...\n');

    // Supprimer l'ancienne table
    console.log('📋 Suppression de l\'ancienne table notifications...');
    await db.query('DROP TABLE IF EXISTS notifications');
    console.log('✅ Ancienne table supprimée');

    // Créer la nouvelle table notifications
    console.log('\n📋 Création de la nouvelle table notifications...');
    await db.query(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error', 'mission', 'demande', 'verification') DEFAULT 'info',
        titre VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        lien VARCHAR(500) NULL,
        lu BOOLEAN DEFAULT FALSE,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_lu (lu),
        INDEX idx_date (date_creation),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table notifications créée');

    // Créer table notifications_globales
    console.log('\n📋 Création de la table notifications_globales...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications_globales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error', 'annonce') DEFAULT 'info',
        titre VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        destinataires ENUM('tous', 'employers', 'freelancers') DEFAULT 'tous',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin (admin_id),
        INDEX idx_date (date_creation),
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table notifications_globales créée');

    // Créer table notifications_specifiques
    console.log('\n📋 Création de la table notifications_specifiques...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications_specifiques (
        id INT AUTO_INCREMENT PRIMARY KEY,
        notification_globale_id INT NOT NULL,
        user_id INT NOT NULL,
        INDEX idx_notification (notification_globale_id),
        INDEX idx_user (user_id),
        FOREIGN KEY (notification_globale_id) REFERENCES notifications_globales(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_notif_user (notification_globale_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table notifications_specifiques créée');

    // Statistiques
    console.log('\n📊 Système de notifications réinitialisé:');
    console.log('✅ Table notifications (utilisateurs)');
    console.log('✅ Table notifications_globales (admin)');
    console.log('✅ Table notifications_specifiques (liaison)');

    console.log('\n🎉 Réinitialisation terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
}

resetNotifications();
