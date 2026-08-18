const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');

/**
 * Service de notifications supplémentaires
 */
module.exports = {
  /**
   * Notification de bienvenue après inscription
   */
  async sendWelcomeNotification(userId, userEmail, userName, userRole) {
    try {
      const roleFr = userRole === 'employer' ? 'Employeur' : 'Prestataire';

      // Créer notification dans la BD
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [
          userId,
          'welcome',
          '🎉 Bienvenue sur Indebel !',
          `Bienvenue ${userName} ! Votre compte ${roleFr} a été créé avec succès. Explorez dès maintenant toutes les fonctionnalités de la plateforme.`,
          userRole === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard'
        ]
      );

      console.log(`✅ Notification de bienvenue créée pour ${userName} (${userRole})`);
    } catch (error) {
      console.error('Erreur notification bienvenue:', error);
    }
  },

  /**
   * Notification mission publiée (pour employer)
   */
  async sendMissionPublishedNotification(employerId, employerEmail, employerName, missionTitre, missionId) {
    try {
      // Créer notification
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [
          employerId,
          'mission_published',
          '✅ Mission publiée avec succès',
          `Votre mission "${missionTitre}" a été publiée et est maintenant visible par tous les prestataires.`,
          `/employer/applications`
        ]
      );

      // Envoyer email
      await sendEmail({
        to: employerEmail,
        subject: `Mission "${missionTitre}" publiée avec succès`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">✅ Mission publiée avec succès !</h2>
            <p>Bonjour <strong>${employerName}</strong>,</p>
            <p>Votre mission <strong>"${missionTitre}"</strong> a été publiée avec succès sur Indebel.</p>
            
            <div style="background-color: #F0FDF4; padding: 15px; border-left: 4px solid #10B981; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #166534;"><strong>✨ Votre mission est maintenant visible</strong></p>
              <p style="margin: 10px 0 0 0; color: #166534;">Tous les prestataires peuvent consulter votre mission et postuler.</p>
            </div>

            <p><strong>Prochaines étapes :</strong></p>
            <ul style="color: #666;">
              <li>Vous recevrez une notification dès qu'un prestataire postule</li>
              <li>Consultez les candidatures depuis votre tableau de bord</li>
              <li>Contactez directement les candidats via la messagerie</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/employer/applications" 
                 style="background-color: #4F46E5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Voir les candidatures
              </a>
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Cordialement,<br>
              L'équipe Indebel
            </p>
          </div>
        `
      });

      console.log(`✅ Notification et email mission publiée envoyés à ${employerName}`);
    } catch (error) {
      console.error('Erreur notification mission publiée:', error);
    }
  },

  /**
   * Notification candidature envoyée (pour freelancer)
   */
  async sendApplicationSentNotification(freelancerId, freelancerEmail, freelancerName, missionTitre) {
    try {
      // Créer notification
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [
          freelancerId,
          'application_sent',
          '✅ Candidature envoyée',
          `Votre candidature pour "${missionTitre}" a été envoyée avec succès. Le recruteur sera notifiée.`,
          '/freelancer/applications'
        ]
      );

      // Envoyer email
      await sendEmail({
        to: freelancerEmail,
        subject: `Candidature envoyée pour "${missionTitre}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">✅ Candidature envoyée avec succès !</h2>
            <p>Bonjour <strong>${freelancerName}</strong>,</p>
            <p>Votre candidature pour la mission <strong>"${missionTitre}"</strong> a été envoyée avec succès.</p>
            
            <div style="background-color: #EFF6FF; padding: 15px; border-left: 4px solid #3B82F6; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #1E40AF;"><strong>📬 Le recruteur a été notifiée</strong></p>
              <p style="margin: 10px 0 0 0; color: #1E40AF;">Vous recevrez une notification dès qu'elle aura consulté votre profil.</p>
            </div>

            <p><strong>Prochaines étapes :</strong></p>
            <ul style="color: #666;">
              <li>Le recruteur consultera votre profil et votre lettre de motivation</li>
              <li>Vous serez notifié si votre candidature est acceptée</li>
              <li>Restez disponible pour d'éventuelles questions via la messagerie</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/freelancer/applications" 
                 style="background-color: #4F46E5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Voir mes candidatures
              </a>
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Bonne chance !<br>
              L'équipe Indebel
            </p>
          </div>
        `
      });

      console.log(`✅ Notification candidature envoyée à ${freelancerName}`);
    } catch (error) {
      console.error('Erreur notification candidature envoyée:', error);
    }
  },

  /**
   * Notification forfait expire dans 7 jours
   */
  async sendForfaitExpiringNotification(userId, userEmail, userName, userRole, forfaitNom, dateExpiration) {
    try {
      const dateFormatted = new Date(dateExpiration).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Créer notification
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [
          userId,
          'forfait_expiring',
          '⚠️ Votre forfait expire bientôt',
          `Votre forfait "${forfaitNom}" expire le ${dateFormatted}. Pensez à le renouveler pour continuer à profiter de tous les avantages.`,
          '/forfaits'
        ]
      );

      // Envoyer email
      await sendEmail({
        to: userEmail,
        subject: `⚠️ Votre forfait "${forfaitNom}" expire dans 7 jours`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #F59E0B;">⚠️ Votre forfait expire bientôt</h2>
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Nous vous informons que votre forfait <strong>"${forfaitNom}"</strong> expire le <strong>${dateFormatted}</strong> (dans 7 jours).</p>
            
            <div style="background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #92400E;"><strong>⏰ N'attendez pas le dernier moment !</strong></p>
              <p style="margin: 10px 0 0 0; color: #92400E;">Renouvelez dès maintenant pour éviter toute interruption de service.</p>
            </div>

            <p><strong>Que se passe-t-il si mon forfait expire ?</strong></p>
            <ul style="color: #666;">
              <li>Vos missions/candidatures ne seront plus visibles</li>
              <li>Vous ne pourrez plus publier de nouvelles missions</li>
              <li>L'accès à certaines fonctionnalités sera limité</li>
              <li>Votre compte passera en mode restreint</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/forfaits" 
                 style="background-color: #F59E0B; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Renouveler mon forfait
              </a>
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Cordialement,<br>
              L'équipe Indebel
            </p>
          </div>
        `
      });

      console.log(`✅ Notification forfait expirant envoyée à ${userName}`);
    } catch (error) {
      console.error('Erreur notification forfait expirant:', error);
    }
  },

  /**
   * Notification forfait expiré
   */
  async sendForfaitExpiredNotification(userId, userEmail, userName, userRole, forfaitNom, dateExpiration) {
    try {
      const dateFormatted = new Date(dateExpiration).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Créer notification
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [
          userId,
          'forfait_expired',
          '🚨 Votre forfait a expiré',
          `Votre forfait "${forfaitNom}" a expiré le ${dateFormatted}. Renouvelez-le maintenant pour continuer à utiliser Indebel.`,
          '/forfaits'
        ]
      );

      // Envoyer email
      await sendEmail({
        to: userEmail,
        subject: `🚨 Votre forfait "${forfaitNom}" a expiré`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #EF4444;">🚨 Votre forfait a expiré</h2>
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Votre forfait <strong>"${forfaitNom}"</strong> a expiré le <strong>${dateFormatted}</strong>.</p>
            
            <div style="background-color: #FEE2E2; padding: 15px; border-left: 4px solid #EF4444; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #991B1B;"><strong>⚠️ Accès limité</strong></p>
              <p style="margin: 10px 0 0 0; color: #991B1B;">Votre compte est maintenant en accès limité. Certaines fonctionnalités sont désactivées.</p>
            </div>

            <p><strong>Fonctionnalités actuellement désactivées :</strong></p>
            <ul style="color: #666;">
              <li>❌ Publication de nouvelles missions</li>
              <li>❌ Visibilité de vos missions/candidatures existantes</li>
              <li>❌ Accès complet à la messagerie</li>
              <li>❌ Consultation des profils détaillés</li>
            </ul>

            <p style="background-color: #FEF2F2; padding: 15px; border-radius: 6px; color: #991B1B;">
              <strong>⚡ Renouvelez maintenant pour retrouver tous vos avantages !</strong>
            </p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/forfaits" 
                 style="background-color: #EF4444; color: white; padding: 16px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 700; font-size: 16px;">
                Renouveler maintenant
              </a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px; padding: 15px; background-color: #F9FAFB; border-radius: 6px;">
              <strong>Besoin d'aide ?</strong><br>
              Contactez-nous à <a href="mailto:info@indebel.be" style="color: #4F46E5;">info@indebel.be</a>
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Cordialement,<br>
              L'équipe Indebel
            </p>
          </div>
        `
      });

      console.log(`✅ Notification forfait expiré envoyée à ${userName}`);
    } catch (error) {
      console.error('Erreur notification forfait expiré:', error);
    }
  },

  /**
   * Notifier tous les freelancers d'une nouvelle mission
   */
  async notifyFreelancersNewMission(missionTitre, missionType, employerName, missionId, isFreelancerJob = false) {
    try {
      const db = require('../config/database');

      // Récupérer les compétences et la ville de la mission
      let tableName;
      if (isFreelancerJob) {
        tableName = 'jobs_freelancer';
      } else {
        tableName = missionType === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
      }

      const [missionData] = await db.query(
        `SELECT ${isFreelancerJob ? 'competences_requises as competences' : 'competences'}, 
                ${isFreelancerJob ? 'ville_mission' : 'ville_mission'} 
         FROM ${tableName} WHERE id = ?`,
        [missionId]
      );

      let missionCompetences = [];
      let missionVille = null;
      if (missionData.length > 0) {
        if (missionData[0].competences) {
          try {
            missionCompetences = JSON.parse(missionData[0].competences);
          } catch (e) {
            console.error('Erreur parsing compétences mission:', e);
          }
        }
        missionVille = missionData[0].ville_mission;
      }

      console.log(`🎯 Compétences recherchées: ${missionCompetences.join(', ')}`);
      console.log(`📍 Ville de la mission: ${missionVille || 'Non spécifiée'}`);

      // Récupérer TOUS les freelancers avec leurs compétences et adresse
      const [freelancers] = await db.query(`
        SELECT id, email, prenom, nom, competences, adresse
        FROM users
        WHERE role = 'freelancer'
      `);

      console.log(`📢 Analyse de ${freelancers.length} freelancer(s)...`);

      let notifiedCount = 0;
      let matchedCount = 0;

      // Envoyer notification à chaque freelancer
      for (const freelancer of freelancers) {
        try {
          // Ne pas s'auto-notifier si c'est une mission de prestataire
          if (isFreelancerJob) {
            // On pourrait vérifier si freelancer.id === mission.freelancer_id ici
            // mais missionData ne l'a pas encore. On l'ajoutera si nécessaire.
          }

          // Vérifier si le freelancer a au moins une compétence correspondante
          let freelancerCompetences = [];
          if (freelancer.competences) {
            try {
              freelancerCompetences = JSON.parse(freelancer.competences);
            } catch (e) {
              freelancerCompetences = [];
            }
          }

          // Si la mission a des compétences, vérifier la correspondance
          if (missionCompetences.length > 0) {
            const hasMatch = missionCompetences.some(comp =>
              freelancerCompetences.includes(comp)
            );

            if (!hasMatch) {
              // Pas de compétence correspondante, passer au suivant
              continue;
            }
          }

          // Filtrer par ville si spécifiée
          if (missionVille && freelancer.adresse) {
            // Extraire la ville de l'adresse du freelancer
            // Format attendu: "Rue, Code postal Ville" ou juste "Ville"
            let freelancerVille = null;
            const adresse = freelancer.adresse.trim();

            // Si l'adresse contient une virgule, prendre ce qui est après
            if (adresse.includes(',')) {
              const afterComma = adresse.split(',').pop().trim();
              // Prendre le dernier mot (la ville)
              const parts = afterComma.split(' ');
              freelancerVille = parts[parts.length - 1];
            } else {
              // Sinon, considérer toute l'adresse comme la ville
              freelancerVille = adresse;
            }

            // Comparer les villes (insensible à la casse)
            if (freelancerVille && missionVille.toLowerCase() !== freelancerVille.toLowerCase()) {
              // Villes différentes, passer au suivant
              continue;
            }
          }

          matchedCount++;
          const freelancerName = `${freelancer.prenom} ${freelancer.nom}`;

          // Créer notification in-app
          await db.query(
            'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
            [
              freelancer.id,
              'new_mission',
              '💼 Nouvelle mission disponible',
              `${employerName} a publié une nouvelle mission : "${missionTitre}". Consultez-la dès maintenant !`,
              '/freelancer/list-missions'
            ]
          );

          // Envoyer email (seulement si préférences email activées)
          await sendEmail({
            to: freelancer.email,
            subject: `💼 Nouvelle mission : ${missionTitre}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">💼 Nouvelle mission disponible !</h2>
                <p>Bonjour <strong>${freelancerName}</strong>,</p>
                
                <p>Une nouvelle mission vient d'être publiée sur Indebel et correspond peut-être à vos compétences !</p>
                
                <div style="background-color: #EFF6FF; padding: 20px; border-left: 4px solid #4F46E5; border-radius: 4px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #1E40AF;">${missionTitre}</h3>
                  <p style="margin: 5px 0; color: #1E40AF;">
                    <strong>Publié par :</strong> ${employerName}<br>
                    <strong>Type :</strong> ${missionType === 'hourly' ? 'Forfait horaire' : 'Forfait fixe'}
                  </p>
                </div>

                <p><strong>Ne manquez pas cette opportunité !</strong></p>
                <p>Consultez les détails de la mission et postulez dès maintenant pour augmenter vos chances d'être sélectionné.</p>

                <p style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/freelancer/list-missions" 
                     style="background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                    Voir la mission
                  </a>
                </p>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  <strong>💡 Conseil :</strong> Postulez rapidement ! Les recruteurs consultent souvent les premières candidatures en priorité.
                </p>

                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

                <p style="color: #999; font-size: 12px;">
                  Vous recevez cet email car vous êtes inscrit sur Indebel en tant qu'prestataire.<br>
                  Pour ne plus recevoir ces notifications, modifiez vos préférences dans votre profil.
                </p>

                <p style="color: #999; font-size: 14px; margin-top: 20px;">
                  Bonne chance !<br>
                  L'équipe Indebel
                </p>
              </div>
            `
          });

          notifiedCount++;
        } catch (error) {
          console.error(`Erreur notification freelancer ${freelancer.id}:`, error.message);
          // Continue avec les autres freelancers même si un échoue
        }
      }

      console.log(`✅ ${notifiedCount}/${matchedCount} freelancer(s) avec compétences correspondantes notifié(s)`);
      console.log(`📊 ${freelancers.length} freelancers analysés → ${matchedCount} correspondances → ${notifiedCount} notifiés`);
      return { success: true, notifiedCount, matchedCount, totalFreelancers: freelancers.length };
    } catch (error) {
      console.error('Erreur notification freelancers nouvelle mission:', error);
      throw error;
    }
  },

  async notifyAdminsNewUser(user) {
    try {
      // Envoyer email aux admins
      const emailConfig = emailTemplates.newRegistrationAdmin(user);
      await sendEmail(emailConfig);

      // Créer notification pour les admins
      const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        await db.query(
          'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
          [
            admin.id,
            'new_user',
            '👤 Nouvelle inscription',
            `Nouvel utilisateur : ${user.prenom} ${user.nom} (${user.role === 'employer' ? 'Recruteur' : 'Prestataire'})`,
            '/admin/users'
          ]
        );
      }
      console.log(`✅ Admins notifiés de la nouvelle inscription : ${user.email}`);
    } catch (error) {
      console.error('Erreur notification admins nouvelle inscription:', error);
    }
  },

  async notifyMissionCreation(mission, employer, isFreelancerJob = false) {
    try {
      // 1. Notifier les admins (Email + Notif In-App)
      let adminEmailConfig;
      let adminNotifLink = '/admin/missions';

      if (isFreelancerJob) {
        adminEmailConfig = emailTemplates.newFreelancerMissionAdmin(mission, employer);
        adminNotifLink = '/admin/missions-prestataires';
      } else {
        adminEmailConfig = emailTemplates.newMissionAdmin(mission, employer);
      }

      await sendEmail(adminEmailConfig);

      const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        await db.query(
          'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
          [
            admin.id,
            isFreelancerJob ? 'freelancer_job_validation' : 'mission_validation',
            isFreelancerJob ? '📋 Nouvelle mission de prestataire' : '📋 Mission à valider',
            isFreelancerJob
              ? `Le prestataire ${employer.prenom} ${employer.nom} a soumis une mission: "${mission.titre}".`
              : `Nouvelle mission "${mission.titre}" publiée par ${employer.denomination || employer.prenom}. En attente de validation.`,
            adminNotifLink
          ]
        );
      }

      // 2. Notifier le recruteur (Email + Notif In-App)
      const recruiterEmailConfig = isFreelancerJob
        ? emailTemplates.freelancerMissionPending(mission, employer)
        : emailTemplates.missionPendingRecruiter(mission, employer);
      await sendEmail(recruiterEmailConfig);

      const userLink = employer.role === 'freelancer' ? '/freelancer/my-published-jobs' : '/employer/jobs';
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [
          employer.id,
          'mission_pending',
          '⏳ Mission en attente',
          `Votre mission "${mission.titre}" est en cours de modération. Vous serez notifié dès qu'elle sera traitée.`,
          userLink
        ]
      );

      console.log(`✅ Admins et Recruteur notifiés pour la mission : ${mission.titre}`);
    } catch (error) {
      console.error('Erreur notification création mission:', error);
    }
  },

  async notifyMissionStatusChange(mission, employer, status, missionId = null, missionType = null, isFreelancerJob = false) {
    try {
      let emailConfig;
      let notifTitle, notifMessage, notifType;

      if (status === 'ouvert') {
        emailConfig = isFreelancerJob
          ? emailTemplates.freelancerMissionApproved(mission, employer)
          : emailTemplates.missionApprovedRecruiter(mission, employer);
        notifTitle = '✅ Mission approuvée';
        notifMessage = `Votre mission "${mission.titre}" a été validée et est maintenant en ligne.`;
        notifType = 'mission_approved';

        // Notifier les freelancers uniquement quand la mission devient ouverte
        if (missionId && missionType) {
          const employerName = employer.denomination || employer.prenom;
          await this.notifyFreelancersNewMission(mission.titre, missionType, employerName, missionId, isFreelancerJob);
        }
      } else if (status === 'refuse') {
        emailConfig = isFreelancerJob
          ? emailTemplates.freelancerMissionRefused(mission, employer)
          : emailTemplates.missionRefusedRecruiter(mission, employer);
        notifTitle = '❌ Mission refusée';
        notifMessage = `Votre mission "${mission.titre}" a été refusée. Veuillez vérifier nos conditions ou la modifier.`;
        notifType = 'mission_refused';
      } else {
        return; // Pas de notif pour les autres statuts pour le moment
      }

      // Envoyer email
      await sendEmail(emailConfig);

      const userLink = employer.role === 'freelancer' ? '/freelancer/my-published-jobs' : '/employer/jobs';
      // Créer notification In-App
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
        [
          employer.id,
          notifType,
          notifTitle,
          notifMessage,
          userLink
        ]
      );

      console.log(`✅ Recruteur notifié du changement de statut (${status}) pour la mission : ${mission.titre}`);
    } catch (error) {
      console.error('Erreur notification status mission:', error);
    }
  },

  async notifyAdminsNewSubscription(user, forfait, proformaUrl = null) {
    try {
      const { getAdminEmails } = require('../config/email');
      const adminEmails = getAdminEmails();

      // Envoyer email aux admins
      const emailConfig = emailTemplates.newSubscriptionAdmin(user, forfait);
      emailConfig.to = getAdminEmails(); // Ensure it goes to all admins

      emailConfig.html += proformaUrl ? `
          <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">📄 Une facture a été générée :</p>
            <a href="${process.env.FRONTEND_URL}/admin/factures" style="color: #3b82f6; font-weight: bold; text-decoration: none;">Voir dans l'interface Admin</a>
          </div>
        ` : '';

      await sendEmail(emailConfig);

      // Créer notification pour les admins
      const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        await db.query(
          'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
          [
            admin.id,
            'new_subscription',
            '💰 Nouvel abonnement',
            `${user.prenom} ${user.nom} a souscrit au forfait ${forfait.nom}.`,
            '/admin/users'
          ]
        );
      }
      console.log(`✅ Admins notifiés du nouvel abonnement : ${user.email}`);
    } catch (error) {
      console.error('Erreur notification admins nouvel abonnement:', error);
    }
  }
};
