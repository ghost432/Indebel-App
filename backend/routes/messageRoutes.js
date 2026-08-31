const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// Créer ou récupérer une conversation
router.post('/conversations', authenticate, messageController.createOrGetConversation);

// Récupérer les conversations de l'utilisateur
router.get('/conversations', authenticate, messageController.getUserConversations);

// Récupérer les messages d'une conversation (deux formats supportés)
router.get('/conversations/:conversationId', authenticate, messageController.getConversationMessages);
router.get('/:conversationId', authenticate, messageController.getConversationMessages);

// Envoyer un message (deux formats supportés)
router.post('/conversations/:conversationId/messages', authenticate, messageController.sendMessage);
router.post('/:conversationId', authenticate, messageController.sendMessage);

module.exports = router;
