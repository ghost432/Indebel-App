const db = require('../config/database');
const { validationResult } = require('express-validator');
const messageNotificationService = require('../services/messageNotificationService');

// Crée ou récupère une conversation existante
async function createOrGetConversation(req, res) {
  try {
    console.log('📩 createOrGetConversation - Body:', req.body);
    console.log('📩 createOrGetConversation - User:', req.user.id, req.user.role);
    
    const { recipientId, recipientType, freelancer_id, employer_id } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Support de l'ancien format ET du nouveau format
    let finalFreelancerId, finalEmployerId;

    if (recipientId && recipientType) {
      // Nouveau format (recipientId + recipientType)
      console.log('📩 Nouveau format détecté:', { recipientId, recipientType });
      if (recipientType === 'freelancer') {
        finalFreelancerId = recipientId;
        finalEmployerId = userId;
      } else {
        finalFreelancerId = userId;
        finalEmployerId = recipientId;
      }
    } else if (freelancer_id && employer_id) {
      // Ancien format (freelancer_id + employer_id)
      console.log('📩 Ancien format détecté:', { freelancer_id, employer_id });
      finalFreelancerId = freelancer_id;
      finalEmployerId = employer_id;
    } else {
      console.log('❌ Format invalide - Body:', req.body);
      return res.status(400).json({
        success: false,
        message: 'recipientId et recipientType requis, ou freelancer_id et employer_id'
      });
    }
    
    console.log('📩 IDs finaux:', { finalFreelancerId, finalEmployerId });

    // Vérification des autorisations
    if (userId != finalFreelancerId && userId != finalEmployerId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette conversation'
      });
    }

    // Vérifier si une conversation existe déjà
    console.log('📩 Vérification conversation existante...');
    const [existing] = await db.query(
      `SELECT * FROM conversations 
       WHERE (freelancer_id = ? AND employer_id = ?) 
       OR (freelancer_id = ? AND employer_id = ?)`,
      [finalFreelancerId, finalEmployerId, finalEmployerId, finalFreelancerId]
    );

    if (existing.length > 0) {
      console.log('✅ Conversation existante trouvée:', existing[0].id);
      return res.json({
        success: true,
        data: existing[0],
        id: existing[0].id
      });
    }

    // Créer une nouvelle conversation
    console.log('📩 Création nouvelle conversation...');
    const [result] = await db.query(
      'INSERT INTO conversations (freelancer_id, employer_id) VALUES (?, ?)',
      [finalFreelancerId, finalEmployerId]
    );

    console.log('✅ Conversation créée avec succès - ID:', result.insertId);
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        freelancer_id: finalFreelancerId,
        employer_id: finalEmployerId
      },
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur createOrGetConversation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

// Récupère les conversations d'un utilisateur
async function getUserConversations(req, res) {
  try {
    const userId = req.user.id;
    const [conversations] = await db.query(
      `SELECT c.*, 
        u1.id as user1_id,
        u1.prenom as user1_prenom,
        u1.nom as user1_nom,
        u1.denomination as user1_denomination,
        u1.photo_profil as user1_photo,
        u1.role as user1_role,
        u2.id as user2_id,
        u2.prenom as user2_prenom,
        u2.nom as user2_nom,
        u2.denomination as user2_denomination,
        u2.photo_profil as user2_photo,
        u2.role as user2_role,
        IF(c.freelancer_id = ?, c.employer_id, c.freelancer_id) as participant_id,
        (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_date,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND (m.is_read = 0 OR m.is_read IS NULL)) AS unread_count
      FROM conversations c
      LEFT JOIN users u1 ON c.freelancer_id = u1.id
      LEFT JOIN users u2 ON c.employer_id = u2.id
      WHERE c.freelancer_id = ? OR c.employer_id = ?
      ORDER BY last_message_date DESC`,
      [userId, userId, userId, userId]
    );

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Erreur getUserConversations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

// Récupère les messages d'une conversation
async function getConversationMessages(req, res) {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;
    
    const [messages] = await db.query(
      `SELECT m.*, u.prenom, u.nom, u.photo_profil
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    
    // Marquer les messages comme lus (ceux que l'utilisateur n'a pas envoyés)
    await db.query(
      `UPDATE messages 
       SET is_read = 1, lu = 1 
       WHERE conversation_id = ? 
       AND sender_id != ? 
       AND (is_read = 0 OR is_read IS NULL)`,
      [conversationId, userId]
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Envoie un message
async function sendMessage(req, res) {
  try {
    const conversationId = req.params.conversationId;
    const senderId = req.user.id;
    const { content } = req.body;

    const [result] = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
      [conversationId, senderId, content]
    );
    
    const messageId = result.insertId;

    // Envoyer notification et email au destinataire (async, ne pas bloquer)
    const receiverId = await messageNotificationService.getMessageReceiver(conversationId, senderId);
    if (receiverId) {
      messageNotificationService.notifyNewMessage(messageId, senderId, receiverId, conversationId, content)
        .catch(err => console.error('Erreur notification:', err));
    }

    res.status(201).json({ 
      success: true, 
      message: { 
        id: messageId, 
        conversation_id: conversationId, 
        sender_id: senderId, 
        content, 
        created_at: new Date() 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

module.exports = {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage
};
