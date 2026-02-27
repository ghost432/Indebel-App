const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('./notificationService');

class ForfaitExpirationService {
  // Vérifier les forfaits qui expirent bientôt
  async checkExpiringForfaits() {
    try {
      console.log('🔍 Vérification des forfaits qui expirent...');
      
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Trouver les forfaits qui expirent dans 7 jours
      const [expiring7Days] = await db.query(`
        SELECT u.id, u.email, u.prenom, u.nom, u.denomination, u.role, 
               u.forfait_date_expiration, f.nom as forfait_nom
        FROM users u
        JOIN forfaits f ON u.forfait_id = f.id
        WHERE u.forfait_date_expiration IS NOT NULL
        AND DATE(u.forfait_date_expiration) = DATE(?)
        AND u.notified_7days = FALSE
      `, [in7Days]);
      
      // Trouver les forfaits qui expirent aujourd'hui
      const [expiringToday] = await db.query(`
        SELECT u.id, u.email, u.prenom, u.nom, u.denomination, u.role,
               u.forfait_date_expiration, f.nom as forfait_nom
        FROM users u
        JOIN forfaits f ON u.forfait_id = f.id
        WHERE u.forfait_date_expiration IS NOT NULL
        AND DATE(u.forfait_date_expiration) = DATE(?)
        AND u.notified_expiration = FALSE
      `, [now]);
      
      console.log(`📅 ${expiring7Days.length} forfait(s) expirent dans 7 jours`);
      console.log(`⚠️  ${expiringToday.length} forfait(s) expirent aujourd'hui`);
      
      // Traiter les alertes 7 jours
      for (const user of expiring7Days) {
        await this.send7DaysAlert(user);
      }
      
      // Traiter les alertes expiration
      for (const user of expiringToday) {
        await this.sendExpirationAlert(user);
      }
      
      return {
        success: true,
        expiring7Days: expiring7Days.length,
        expiringToday: expiringToday.length
      };
    } catch (error) {
      console.error('❌ Erreur vérification forfaits:', error);
      throw error;
    }
  }
  
  // Envoyer alerte 7 jours avant expiration
  async send7DaysAlert(user) {
    try {
      const displayName = user.role === 'employer' 
        ? user.denomination 
        : `${user.prenom} ${user.nom}`;
      
      const dateExpiration = new Date(user.forfait_date_expiration).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Créer notification
      await notificationService.createNotification(
        user.id,
        'forfait_expiration_7days',
        '⚠️ Votre forfait expire bientôt',
        `Votre forfait "${user.forfait_nom}" expire le ${dateExpiration}. Pensez à renouveler pour continuer à profiter de tous les avantages.`,
        { 
          forfait_nom: user.forfait_nom,
          date_expiration: user.forfait_date_expiration,
          jours_restants: 7
        }
      );
      
      // Envoyer email
      const renewalUrl = user.role === 'employer' 
        ? `${process.env.FRONTEND_URL}/employer/forfaits`
        : `${process.env.FRONTEND_URL}/freelancer/forfaits`;
      
      await sendEmail({
        to: user.email,
        subject: '⚠️ Votre forfait Indebel expire dans 7 jours',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Bonjour ${displayName},</h2>
            
            <p>Nous vous informons que votre forfait <strong>${user.forfait_nom}</strong> expire le <strong>${dateExpiration}</strong>.</p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⏰ Plus que 7 jours</strong> pour renouveler votre abonnement et continuer à profiter de tous les avantages.
              </p>
            </div>
            
            <p>Pour renouveler votre forfait dès maintenant :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${renewalUrl}" 
                 style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Renouveler mon forfait
              </a>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>L'équipe Indebel</p>
          </div>
        `
      });
      
      // Marquer comme notifié
      await db.query(
        'UPDATE users SET notified_7days = TRUE WHERE id = ?',
        [user.id]
      );
      
      console.log(`✅ Alerte 7 jours envoyée à ${user.email}`);
    } catch (error) {
      console.error(`❌ Erreur envoi alerte 7 jours pour ${user.email}:`, error);
    }
  }
  
  // Envoyer alerte jour d'expiration
  async sendExpirationAlert(user) {
    try {
      const displayName = user.role === 'employer' 
        ? user.denomination 
        : `${user.prenom} ${user.nom}`;
      
      // Créer notification
      await notificationService.createNotification(
        user.id,
        'forfait_expired',
        '🚨 Votre forfait a expiré',
        `Votre forfait "${user.forfait_nom}" a expiré aujourd'hui. Renouvelez-le maintenant pour continuer à utiliser Indebel sans interruption.`,
        { 
          forfait_nom: user.forfait_nom,
          date_expiration: user.forfait_date_expiration
        }
      );
      
      // Envoyer email
      const renewalUrl = user.role === 'employer' 
        ? `${process.env.FRONTEND_URL}/employer/forfaits`
        : `${process.env.FRONTEND_URL}/freelancer/forfaits`;
      
      await sendEmail({
        to: user.email,
        subject: '🚨 Votre forfait Indebel a expiré',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Bonjour ${displayName},</h2>
            
            <p>Votre forfait <strong>${user.forfait_nom}</strong> a expiré aujourd'hui.</p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;">
                <strong>⚠️ Accès limité</strong><br>
                Sans forfait actif, vous ne pouvez plus ${user.role === 'employer' ? 'publier de missions' : 'postuler aux missions'}.
              </p>
            </div>
            
            <p>Renouvelez votre forfait dès maintenant pour retrouver tous vos avantages :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${renewalUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Renouveler immédiatement
              </a>
            </div>
            
            <p>Si vous avez des questions, notre équipe est là pour vous aider.</p>
            
            <p>Cordialement,<br>L'équipe Indebel</p>
          </div>
        `
      });
      
      // Marquer comme notifié
      await db.query(
        'UPDATE users SET notified_expiration = TRUE WHERE id = ?',
        [user.id]
      );
      
      console.log(`✅ Alerte expiration envoyée à ${user.email}`);
    } catch (error) {
      console.error(`❌ Erreur envoi alerte expiration pour ${user.email}:`, error);
    }
  }
  
  // Vérifier si le forfait d'un utilisateur est expiré
  async isForfaitExpired(userId) {
    try {
      const [users] = await db.query(`
        SELECT forfait_date_expiration 
        FROM users 
        WHERE id = ?
      `, [userId]);
      
      if (users.length === 0 || !users[0].forfait_date_expiration) {
        return true; // Pas de forfait = expiré
      }
      
      const dateExpiration = new Date(users[0].forfait_date_expiration);
      const now = new Date();
      
      return now > dateExpiration;
    } catch (error) {
      console.error('Erreur vérification expiration:', error);
      return true; // En cas d'erreur, considérer comme expiré par sécurité
    }
  }
}

module.exports = new ForfaitExpirationService();
