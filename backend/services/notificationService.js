const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');

/**
 * Service de gestion des notifications
 */
const notificationService = {
  validTypes: new Set([
    'info',
    'success',
    'warning',
    'error',
    'mission',
    'demande',
    'verification',
    'new_mission',
    'welcome',
    'mission_published',
    'application_sent',
    'forfait_expiring',
    'forfait_expired',
    'new_mission_admin',
    'mission_pending',
    'mission_approved',
    'mission_rejected',
    'new_message',
    'application_received',
    'mission_ignored',
    'application_accepted',
    'application_accepted_by_employer'
  ]),

  normalizeType(type) {
    return this.validTypes.has(type) ? type : 'info';
  },

  /**
   * Créer une notification
   */
  async createNotification(userId, type, titre, message, data = null) {
    try {
      const safeType = this.normalizeType(type);
      // Générer le lien basé sur le type ou les données
      let lien = null;
      if (data) {
        if (data.lien) {
          lien = data.lien;
        } else if (data.conversation_id) {
          lien = `/messages?conversation_id=${data.conversation_id}`;
        } else if (data.demande_id) {
          lien = '/employer/demandes';
        } else if (data.forfait) {
          lien = '/forfaits';
        }
      }
      
      const [result] = await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [userId, safeType, titre, message, lien]
      );
      return result.insertId;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  },

  /**
   * Notification + Email : Freelancer postule à une mission
   */
  async notifyApplicationSent(freelancerId, employerId, missionTitre, freelancerNom, employerEmail, employerDenomination) {
    try {
      // Notification pour le freelancer
      await this.createNotification(
        freelancerId,
        'application_sent',
        'Candidature envoyée',
        `Votre candidature pour "${missionTitre}" a été envoyée avec succès.`,
        { missionTitre }
      );

      // Notification pour l'employer
      await this.createNotification(
        employerId,
        'application_received',
        'Nouvelle candidature',
        `${freelancerNom} a postulé à votre mission "${missionTitre}".`,
        { freelancerNom, missionTitre }
      );

      // Email pour l'employer
      await sendEmail({
        to: employerEmail,
        subject: `Nouvelle candidature pour ${missionTitre}`,
        html: `
          <h2>Nouvelle candidature reçue</h2>
          <p>Bonjour ${employerDenomination || 'Chère recruteur'},</p>
          <p><strong>${freelancerNom}</strong> vient de postuler à votre mission <strong>"${missionTitre}"</strong>.</p>
          <p>Connectez-vous à votre espace pour consulter sa candidature et son profil.</p>
          <p><a href="${process.env.FRONTEND_URL}/employer/applications" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir les candidatures</a></p>
          <p>Cordialement,<br>L'équipe Indebel</p>
        `
      });

      console.log('✅ Notifications et email envoyés (candidature)');
    } catch (error) {
      console.error('Erreur notification candidature:', error);
    }
  },

  /**
   * Notification : Freelancer ignore une mission
   */
  async notifyMissionIgnored(freelancerId, missionTitre) {
    try {
      await this.createNotification(
        freelancerId,
        'mission_ignored',
        'Mission ignorée',
        `Vous avez ignoré la mission "${missionTitre}". Elle n'apparaîtra plus dans votre liste.`,
        { missionTitre }
      );

      console.log('✅ Notification mission ignorée envoyée');
    } catch (error) {
      console.error('Erreur notification mission ignorée:', error);
    }
  },

  /**
   * Notification + Email : Nouveau message
   */
  async notifyNewMessage(senderId, recipientId, senderNom, recipientEmail, recipientNom, messagePreview) {
    try {
      // Notification pour le destinataire
      await this.createNotification(
        recipientId,
        'new_message',
        'Nouveau message',
        `${senderNom} vous a envoyé un message : "${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}"`,
        { senderId, senderNom }
      );

      // Email pour le destinataire
      await sendEmail({
        to: recipientEmail,
        subject: `Nouveau message de ${senderNom} sur Indebel`,
        html: `
          <h2>Nouveau message reçu</h2>
          <p>Bonjour ${recipientNom},</p>
          <p><strong>${senderNom}</strong> vous a envoyé un message :</p>
          <blockquote style="border-left: 4px solid #4F46E5; padding-left: 15px; margin: 20px 0; color: #555;">
            ${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}
          </blockquote>
          <p><a href="${process.env.FRONTEND_URL}/messages" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Lire le message</a></p>
          <p>Cordialement,<br>L'équipe Indebel</p>
        `
      });

      console.log('✅ Notification et email nouveau message envoyés');
    } catch (error) {
      console.error('Erreur notification nouveau message:', error);
    }
  },

  /**
   * Notification + Email : Candidature acceptée
   */
  async notifyApplicationAccepted(freelancerId, freelancerEmail, freelancerNom, missionTitre, employerDenomination) {
    try {
      // Notification
      await this.createNotification(
        freelancerId,
        'application_accepted',
        'Candidature acceptée',
        `Félicitations ! Votre candidature pour "${missionTitre}" a été acceptée par ${employerDenomination}.`,
        { missionTitre, employerDenomination }
      );

      // Email
      await sendEmail({
        to: freelancerEmail,
        subject: `Candidature acceptée pour ${missionTitre}`,
        html: `
          <h2>Félicitations ! 🎉</h2>
          <p>Bonjour ${freelancerNom},</p>
          <p>Nous avons le plaisir de vous informer que <strong>${employerDenomination}</strong> a accepté votre candidature pour la mission <strong>"${missionTitre}"</strong>.</p>
          <p><strong>La mission est maintenant en cours.</strong> Vous pouvez contacter le recruteur par message pour convenir des prochaines étapes.</p>
          <p><a href="${process.env.FRONTEND_URL}/freelancer/applications" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir ma candidature</a></p>
          <p>Cordialement,<br>L'équipe Indebel</p>
        `
      });

      console.log('✅ Notification et email candidature acceptée envoyés');
    } catch (error) {
      console.error('Erreur notification candidature acceptée:', error);
    }
  },

  /**
   * Notification + Email : Employer accepte une candidature
   */
  async notifyEmployerAcceptedApplication(employerId, employerEmail, employerName, freelancerName, missionTitre) {
    try {
      // Notification
      await this.createNotification(
        employerId,
        'application_accepted_by_employer',
        'Candidature acceptée',
        `Vous avez accepté la candidature de ${freelancerName} pour "${missionTitre}". La mission est maintenant en cours.`,
        { freelancerName, missionTitre }
      );

      // Email
      await sendEmail({
        to: employerEmail,
        subject: `Candidature acceptée - ${missionTitre}`,
        html: `
          <h2>Candidature acceptée ✅</h2>
          <p>Bonjour ${employerName},</p>
          <p>Vous avez accepté la candidature de <strong>${freelancerName}</strong> pour la mission <strong>"${missionTitre}"</strong>.</p>
          <p><strong>La mission est maintenant en cours.</strong> N'oubliez pas d'écrire à le prestataire pour convenir des prochaines étapes.</p>
          <p><a href="${process.env.FRONTEND_URL}/employer/mes-messages" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Contacter le prestataire</a></p>
          <p>Cordialement,<br>L'équipe Indebel</p>
        `
      });

      console.log('✅ Notification et email acceptation envoyés à l\'employeur');
    } catch (error) {
      console.error('Erreur notification employer acceptation:', error);
    }
  },

  /**
   * Notification + Email : Candidature refusée
   */
  async notifyApplicationRejected(freelancerId, freelancerEmail, freelancerNom, missionTitre, employerDenomination, motif) {
    try {
      // Notification
      await this.createNotification(
        freelancerId,
        'application_rejected',
        'Candidature refusée',
        `Votre candidature pour "${missionTitre}" n'a pas été retenue par ${employerDenomination}.`,
        { missionTitre, employerDenomination, motif }
      );

      // Email
      await sendEmail({
        to: freelancerEmail,
        subject: `Candidature refusée pour ${missionTitre}`,
        html: `
          <h2>Candidature non retenue</h2>
          <p>Bonjour ${freelancerNom},</p>
          <p>Nous vous informons que <strong>${employerDenomination}</strong> n'a pas retenu votre candidature pour la mission <strong>"${missionTitre}"</strong>.</p>
          ${motif ? `<p><strong>Motif :</strong> ${motif}</p>` : ''}
          <p>Ne vous découragez pas ! D'autres opportunités vous attendent.</p>
          <p><a href="${process.env.FRONTEND_URL}/freelancer/list-missions" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Découvrir d'autres missions</a></p>
          <p>Cordialement,<br>L'équipe Indebel</p>
        `
      });

      console.log('✅ Notification et email candidature refusée envoyés');
    } catch (error) {
      console.error('Erreur notification candidature refusée:', error);
    }
  },

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(userId, limit = 50) {
    try {
      const [notifications] = await db.query(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY date_creation DESC 
         LIMIT ?`,
        [userId, limit]
      );
      return notifications;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw error;
    }
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId, userId) {
    try {
      await db.query(
        'UPDATE notifications SET lu = TRUE WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
    } catch (error) {
      console.error('Erreur marquage notification lue:', error);
      throw error;
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId) {
    try {
      await db.query(
        'UPDATE notifications SET lu = TRUE WHERE user_id = ? AND lu = FALSE',
        [userId]
      );
    } catch (error) {
      console.error('Erreur marquage toutes notifications lues:', error);
      throw error;
    }
  },

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(userId) {
    try {
      const [result] = await db.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND lu = FALSE',
        [userId]
      );
      return result[0].count;
    } catch (error) {
      console.error('Erreur comptage notifications non lues:', error);
      throw error;
    }
  },

  /**
   * Notification + Email : Action d'un Sous-Admin
   */
  async notifySubAdminAction(subAdminId, subAdminName, subAdminEmail, actionMessage) {
    try {
      // Create notification for Super Admins
      const [superAdminUsers] = await db.query('SELECT id FROM users WHERE role = "admin" AND (id = 1 OR email = "admin@indebel.com" OR email = "indegobelgique@gmail.com")');
      
      for (const sa of superAdminUsers) {
        if (sa.id === subAdminId) continue; // Don't notify the subadmin themselves if they somehow match
        
        await this.createNotification(
          sa.id,
          'info',
          'Action Sous-Admin',
          `${subAdminName} a effectué une action : ${actionMessage.split('.')[0]}`
        );
      }

      // Send Email using the new template
      const subAdmin = { prenom: subAdminName, nom: '', email: subAdminEmail };
      const emailConfig = emailTemplates.subAdminActionAdmin(subAdmin, actionMessage);
      await sendEmail(emailConfig);

      console.log(`✅ Notification et email envoyés au Super Admin pour l'action du Sous-Admin`);
    } catch (error) {
      console.error('Erreur notification action sous-admin:', error);
    }
  }
};

module.exports = notificationService;
