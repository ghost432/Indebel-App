const db = require('../config/database');
const { sendEmail } = require('../config/email');

/**
 * Extensions pour notifications supplémentaires
 */
module.exports = {
  /**
   * Notification bienvenue
   */
  async notifyWelcome(userId, userName, userRole) {
    await db.query(
      'INSERT INTO notifications (user_id, type, titre, message) VALUES (?, ?, ?, ?)',
      [userId, 'welcome', '🎉 Bienvenue sur Indebel !', `Bienvenue ${userName} !`]
    );
  },

  /**
   * Notification mission publiée
   */
  async notifyMissionPublished(employerId, email, name, titre) {
    await db.query(
      'INSERT INTO notifications (user_id, type, titre, message) VALUES (?, ?, ?, ?)',
      [employerId, 'mission_published', '✅ Mission publiée', `Mission "${titre}" publiée`]
    );
    
    await sendEmail({
      to: email,
      subject: 'Mission publiée',
      html: `<p>Bonjour ${name}, mission "${titre}" publiée avec succès.</p>`
    });
  },

  /**
   * Notification forfait expire (7j)
   */
  async notifyForfaitExpiring(userId, email, name, forfait, date) {
    await db.query(
      'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
      [userId, 'forfait_expiring', '⚠️ Forfait expire', `Forfait "${forfait}" expire le ${date}`, '/forfaits']
    );
    
    await sendEmail({
      to: email,
      subject: 'Forfait expire dans 7 jours',
      html: `<p>Bonjour ${name}, votre forfait expire bientôt.</p><a href="${process.env.FRONTEND_URL}/forfaits">Renouveler</a>`
    });
  },

  /**
   * Notification forfait expiré
   */
  async notifyForfaitExpired(userId, email, name, forfait) {
    await db.query(
      'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
      [userId, 'forfait_expired', '🚨 Forfait expiré', `Forfait "${forfait}" expiré`, '/forfaits']
    );
    
    await sendEmail({
      to: email,
      subject: 'Forfait expiré',
      html: `<p>Bonjour ${name}, votre forfait a expiré.</p><a href="${process.env.FRONTEND_URL}/forfaits">Renouveler</a>`
    });
  }
};
