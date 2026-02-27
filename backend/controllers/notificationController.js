const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('../services/notificationService');

// Récupérer les notifications d'un utilisateur
exports.getUserNotifications = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const [notifications] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY date_creation DESC 
       LIMIT ? OFFSET ?`,
      [user_id, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total, SUM(lu = 0) as non_lues FROM notifications WHERE user_id = ?',
      [user_id]
    );

    res.json({
      success: true,
      data: notifications,
      total: countResult[0].total,
      non_lues: countResult[0].non_lues || 0
    });
  } catch (error) {
    next(error);
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await db.query(
      'UPDATE notifications SET lu = TRUE WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    res.json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    next(error);
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    await db.query(
      'UPDATE notifications SET lu = TRUE WHERE user_id = ? AND lu = FALSE',
      [user_id]
    );

    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    next(error);
  }
};

// Supprimer une notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    res.json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    next(error);
  }
};

// Notifier mission ignorée
exports.notifyMissionIgnored = async (req, res, next) => {
  try {
    const { missionId, missionTitre } = req.body;
    const user_id = req.user.id;

    await notificationService.notifyMissionIgnored(user_id, missionTitre);

    res.json({ success: true, message: 'Notification créée' });
  } catch (error) {
    next(error);
  }
};

// Créer une notification (usage interne)
exports.createNotification = async (user_id, type, titre, message, lien = null) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
      [user_id, type, titre, message, lien]
    );
    return true;
  } catch (error) {
    console.error('Erreur création notification:', error);
    return false;
  }
};

// ========== ADMIN : Envoyer des notifications ==========

// Envoyer notification à tous les utilisateurs ou par rôle
exports.sendNotificationToAll = async (req, res, next) => {
  try {
    const { type, titre, message, destinataires = 'tous', envoyer_email = false } = req.body;
    const admin_id = req.user.id;

    if (!titre || !message) {
      return res.status(400).json({
        success: false,
        message: 'Titre et message requis'
      });
    }

    // Créer la notification globale
    const [result] = await db.query(
      'INSERT INTO notifications_globales (admin_id, type, titre, message, destinataires) VALUES (?, ?, ?, ?, ?)',
      [admin_id, type, titre, message, destinataires]
    );

    // Récupérer les utilisateurs selon les destinataires
    let query = 'SELECT id, email, prenom, nom FROM users WHERE role != "admin"';
    const params = [];

    if (destinataires === 'employers') {
      query += ' AND role = "employer"';
    } else if (destinataires === 'freelancers') {
      query += ' AND role = "freelancer"';
    }

    const [users] = await db.query(query, params);

    // Créer une notification pour chaque utilisateur
    for (const user of users) {
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message) VALUES (?, ?, ?, ?)',
        [user.id, type, titre, message]
      );

      // Envoyer email si demandé
      if (envoyer_email) {
        await sendEmail({
          to: user.email,
          subject: titre,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">${titre}</h2>
              <p>Bonjour ${user.prenom},</p>
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1F2937; margin: 0;">${message}</p>
              </div>
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                L'équipe Indebel
              </p>
            </div>
          `
        }).catch(err => console.error('Erreur envoi email:', err));
      }
    }

    res.json({
      success: true,
      message: `Notification envoyée à ${users.length} utilisateur(s)`,
      count: users.length
    });
  } catch (error) {
    next(error);
  }
};

// Envoyer notification à des utilisateurs spécifiques
exports.sendNotificationToUsers = async (req, res, next) => {
  try {
    const { type, titre, message, user_ids, envoyer_email = false } = req.body;
    const admin_id = req.user.id;

    if (!titre || !message || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Titre, message et liste d\'utilisateurs requis'
      });
    }

    // Créer la notification globale
    const [result] = await db.query(
      'INSERT INTO notifications_globales (admin_id, type, titre, message, destinataires) VALUES (?, ?, ?, ?, ?)',
      [admin_id, type || 'info', titre, message, 'specifiques']
    );

    const notification_globale_id = result.insertId;

    // Récupérer les infos des utilisateurs
    const placeholders = user_ids.map(() => '?').join(',');
    const [users] = await db.query(
      `SELECT id, email, prenom, nom FROM users WHERE id IN (${placeholders})`,
      user_ids
    );

    // Créer notification pour chaque utilisateur
    for (const user of users) {
      // Notification individuelle
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message) VALUES (?, ?, ?, ?)',
        [user.id, type, titre, message]
      );

      // Liaison spécifique
      await db.query(
        'INSERT INTO notifications_specifiques (notification_globale_id, user_id) VALUES (?, ?)',
        [notification_globale_id, user.id]
      );

      // Envoyer email si demandé
      if (envoyer_email) {
        await sendEmail({
          to: user.email,
          subject: titre,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">${titre}</h2>
              <p>Bonjour ${user.prenom},</p>
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #1F2937; margin: 0;">${message}</p>
              </div>
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                L'équipe Indebel
              </p>
            </div>
          `
        }).catch(err => console.error('Erreur envoi email:', err));
      }
    }

    res.json({
      success: true,
      message: `Notification envoyée à ${users.length} utilisateur(s)`,
      count: users.length
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer l'historique des notifications envoyées (admin)
exports.getNotificationHistory = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const [notifications] = await db.query(
      `SELECT 
        ng.*,
        u.prenom as admin_prenom,
        u.nom as admin_nom,
        (SELECT COUNT(*) FROM notifications WHERE titre = ng.titre AND message = ng.message) as recipients_count
       FROM notifications_globales ng
       LEFT JOIN users u ON ng.admin_id = u.id
       ORDER BY ng.date_creation DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// Récupérer toutes les notifications de la plateforme (admin)
exports.getAllPlatformNotifications = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const [notifications] = await db.query(
      `SELECT 
        n.*,
        u.prenom,
        u.nom,
        u.email,
        u.role,
        u.denomination
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       ORDER BY n.date_creation DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM notifications'
    );

    res.json({
      success: true,
      data: notifications,
      total: countResult[0].total
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
