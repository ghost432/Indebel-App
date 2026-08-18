const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/auth');

// Routes utilisateur (authentification requise)
// Créer un ticket
router.post('/tickets', authenticate, supportController.createTicket);

// Obtenir les tickets de l'utilisateur
router.get('/tickets', authenticate, supportController.getUserTickets);

// Obtenir un ticket spécifique
router.get('/tickets/:id', authenticate, supportController.getTicketById);

// Ajouter une réponse à un ticket
router.post('/tickets/:id/responses', authenticate, supportController.addResponse);

// Obtenir le nombre de tickets non lus
router.get('/unread-count', authenticate, supportController.getUnreadCount);

// Routes admin uniquement
router.get('/admin/tickets', authenticate, supportController.getAllTickets);
router.patch('/admin/tickets/:id/status', authenticate, supportController.updateTicketStatus);
router.get('/admin/stats', authenticate, supportController.getSupportStats);

module.exports = router;
