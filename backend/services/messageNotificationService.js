const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('./notificationService');

class MessageNotificationService {
  // Envoyer notification et email pour un nouveau message
  async notifyNewMessage(messageId, senderId, receiverId, conversationId, content) {
    try {
      // Récupérer les infos de l'expéditeur et du destinataire
      const [users] = await db.query(
        `SELECT id, email, prenom, nom, denomination, role 
         FROM users 
         WHERE id IN (?, ?)`,
        [senderId, receiverId]
      );
      
      if (users.length < 2) {
        console.log('⚠️ Utilisateur(s) non trouvé(s)');
        return;
      }
      
      const sender = users.find(u => u.id === senderId);
      const receiver = users.find(u => u.id === receiverId);
      
      const senderName = sender.role === 'employer' 
        ? (sender.denomination || `${sender.prenom || ''} ${sender.nom || ''}`.trim() || 'Une entreprise')
        : (`${sender.prenom || ''} ${sender.nom || ''}`.trim() || sender.denomination || 'Un prestataire');
      
      const receiverName = receiver.role === 'employer' 
        ? (receiver.denomination || `${receiver.prenom || ''} ${receiver.nom || ''}`.trim() || 'Bonjour')
        : (`${receiver.prenom || ''} ${receiver.nom || ''}`.trim() || receiver.denomination || 'Bonjour');
      
      // Tronquer le contenu pour l'aperçu
      const preview = content.length > 50 
        ? content.substring(0, 50) + '...' 
        : content;
      
      const messagesUrl = receiver.role === 'employer'
        ? `${process.env.FRONTEND_URL}/employer/mes-messages?conversation_id=${conversationId}`
        : `${process.env.FRONTEND_URL}/freelancer/mes-messages?conversation_id=${conversationId}`;
      const appMessagePath = receiver.role === 'employer'
        ? `/employer/mes-messages?conversation_id=${conversationId}`
        : `/freelancer/mes-messages?conversation_id=${conversationId}`;

      // Créer notification in-app
      await notificationService.createNotification(
        receiverId,
        'new_message',
        `💬 Nouveau message de ${senderName}`,
        preview,
        {
          conversation_id: conversationId,
          sender_id: senderId,
          message_id: messageId,
          lien: appMessagePath
        }
      );
      
      // Envoyer email
      await sendEmail({
        to: receiver.email,
        subject: `💬 Nouveau message de ${senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Bonjour ${receiverName},</h2>
            
            <p>Vous avez reçu un nouveau message de <strong>${senderName}</strong> :</p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-style: italic;">
                "${preview}"
              </p>
            </div>
            
            <p>Pour lire et répondre au message :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${messagesUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir le message
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Vous recevez cet email car quelqu'un vous a envoyé un message sur Indebel.
            </p>
            
            <p>Cordialement,<br>L'équipe Indebel</p>
          </div>
        `
      });
      
      console.log(`✅ Notification envoyée pour nouveau message à ${receiver.email}`);
    } catch (error) {
      console.error('❌ Erreur envoi notification message:', error);
      // Ne pas bloquer l'envoi du message si la notification échoue
    }
  }
  
  // Obtenir le destinataire d'un message dans une conversation
  async getMessageReceiver(conversationId, senderId) {
    try {
      const [conversations] = await db.query(
        'SELECT freelancer_id, employer_id FROM conversations WHERE id = ?',
        [conversationId]
      );
      
      if (conversations.length === 0) {
        return null;
      }
      
      const conv = conversations[0];
      // Le destinataire est l'autre participant
      return conv.freelancer_id === senderId 
        ? conv.employer_id 
        : conv.freelancer_id;
    } catch (error) {
      console.error('Erreur récupération destinataire:', error);
      return null;
    }
  }
}

module.exports = new MessageNotificationService();
