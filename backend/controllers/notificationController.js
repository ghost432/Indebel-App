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
    const { type, titre, message, destinataires = 'tous', envoyer_email = false, bouton_type = 'mon_compte', bouton_texte = '', bouton_url = '' } = req.body;
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
    const notifLien = (bouton_type === 'autre' && bouton_url) ? bouton_url : null;
    for (const user of users) {
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [user.id, type, titre, message, notifLien]
      );

      // Envoyer email si demandé
      if (envoyer_email) {
        const typeColor = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6';
        const typeBg = type === 'success' ? '#d1fae5' : type === 'warning' ? '#fef3c7' : type === 'error' ? '#fee2e2' : '#eff6ff';

        const buttonText = (bouton_type === 'autre' && bouton_texte) ? bouton_texte : 'Accéder à mon compte';
        const buttonUrl = (bouton_type === 'autre' && bouton_url) ? bouton_url : `${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/login`;

        await sendEmail({
          to: user.email,
          subject: titre,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-top: 5px solid ${typeColor};">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h1 style="color: ${typeColor}; margin: 0; font-size: 24px;">Indebel</h1>
                </div>
                
                <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">${titre}</h2>
                
                <p style="color: #4b5563; font-size: 16px;">Bonjour ${user.prenom || 'Cher utilisateur'},</p>
                
                <div style="background-color: ${typeBg}; border-left: 4px solid ${typeColor}; padding: 20px; border-radius: 4px; margin: 25px 0;">
                  <p style="color: #1f2937; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${buttonUrl}" 
                     style="display: inline-block; background-color: ${typeColor}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                    ${buttonText}
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Vous recevez cet email car vous êtes inscrit sur Indebel.<br/>
                  Cordialement,<br/><strong>L'équipe Indebel</strong>
                </p>
              </div>
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
    const { type, titre, message, user_ids, envoyer_email = false, bouton_type = 'mon_compte', bouton_texte = '', bouton_url = '' } = req.body;
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
    const notifLien = (bouton_type === 'autre' && bouton_url) ? bouton_url : null;
    for (const user of users) {
      // Notification individuelle
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [user.id, type, titre, message, notifLien]
      );

      // Liaison spécifique
      await db.query(
        'INSERT INTO notifications_specifiques (notification_globale_id, user_id) VALUES (?, ?)',
        [notification_globale_id, user.id]
      );

      // Envoyer email si demandé
      if (envoyer_email) {
        const typeColor = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6';
        const typeBg = type === 'success' ? '#d1fae5' : type === 'warning' ? '#fef3c7' : type === 'error' ? '#fee2e2' : '#eff6ff';

        const buttonText = (bouton_type === 'autre' && bouton_texte) ? bouton_texte : 'Accéder à mon compte';
        const buttonUrl = (bouton_type === 'autre' && bouton_url) ? bouton_url : `${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/login`;

        await sendEmail({
          to: user.email,
          subject: titre,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-top: 5px solid ${typeColor};">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h1 style="color: ${typeColor}; margin: 0; font-size: 24px;">Indebel</h1>
                </div>
                
                <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">${titre}</h2>
                
                <p style="color: #4b5563; font-size: 16px;">Bonjour ${user.prenom || 'Cher utilisateur'},</p>
                
                <div style="background-color: ${typeBg}; border-left: 4px solid ${typeColor}; padding: 20px; border-radius: 4px; margin: 25px 0;">
                  <p style="color: #1f2937; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${buttonUrl}" 
                     style="display: inline-block; background-color: ${typeColor}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                    ${buttonText}
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Vous recevez cet email car vous êtes inscrit sur Indebel.<br/>
                  Cordialement,<br/><strong>L'équipe Indebel</strong>
                </p>
              </div>
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


exports.sendNewsletter = async (req, res, next) => {
  try {
    // Only allow admin (or superadmin)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const { sujet, contenu, destinataires } = req.body;

    if (!sujet || !contenu) {
      return res.status(400).json({ success: false, message: 'Sujet et contenu requis' });
    }

    let query = 'SELECT email, prenom, nom, denomination FROM users WHERE role != "admin" AND accepte_emails = TRUE';
    const params = [];

    if (destinataires === 'freelancers') {
      query += ' AND role = "freelancer"';
    } else if (destinataires === 'employers') {
      query += ' AND role = "employer"';
    } else if (destinataires === 'specific' && req.body.user_id) {
      query += ' AND id = ?';
      params.push(req.body.user_id);
    }
    
    // If it's a sub-admin, only send to users they created, UNLESS it's a specific user check
    if (req.user.email !== 'noreply@indebel.be') {
      query += ' AND (created_by = ? OR id = ?)';
      params.push(req.user.id, req.user.id);
    }

    const [users] = await db.query(query, params);

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun destinataire trouvé' });
    }

    // Save newsletter to DB
    const [insertResult] = await db.query(
      'INSERT INTO newsletters (sujet, contenu, image_url, destinataires, user_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [sujet, contenu, req.body.image_url || null, destinataires, req.body.user_id || null, req.user.id]
    );

    // Send emails in background
    (async () => {
      for (const u of users) {
        try {
          const name = u.denomination || u.prenom || u.nom || 'Utilisateur';
          let imageHtml = '';
          if (req.body.image_url) {
            imageHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${req.body.image_url}" alt="Newsletter Image" style="max-width: 100%; border-radius: 8px;"></div>`;
          }
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-top: 5px solid #3b82f6;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Indebel - Newsletter</h1>
                </div>
                ${imageHtml}
                <p style="color: #4b5563; font-size: 16px;">Bonjour ${name},</p>
                <div style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 25px 0;">
                  ${contenu}
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Vous recevez cet email car vous êtes inscrit sur Indebel.<br/>
                  <strong>L'équipe Indebel</strong>
                </p>
              </div>
            </div>
          `;

          await sendEmail({
            to: u.email,
            subject: sujet,
            html: emailHtml
          });
          
          // sleep 500ms to avoid rate limiting
          await new Promise(r => setTimeout(r, 500));
        } catch(e) {
          console.error('Erreur envoi newsletter à', u.email, e);
        }
      }
    })();

    res.json({
      success: true,
      message: `Newsletter en cours d'envoi à ${users.length} utilisateur(s)`,
      data: { id: insertResult.insertId }
    });

  } catch (error) {
    next(error);
  }
};

exports.getNewsletters = async (req, res, next) => {
  try {
    let query = 'SELECT * FROM newsletters';
    let params = [];
    
    if (req.user.email !== 'noreply@indebel.be' && req.user.role === 'admin') {
      query += ' WHERE created_by = ?';
      params.push(req.user.id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [newsletters] = await db.query(query, params);
    res.json({ success: true, data: newsletters });
  } catch (error) {
    next(error);
  }
};
