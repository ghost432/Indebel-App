const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const { authenticate } = require('../middleware/auth');

// Obtenir la configuration publique Stripe (public - nécessaire pour le frontend)
router.get('/config', paiementController.getStripeConfig);

// Créer une session de paiement (authentifié)
router.post('/create-checkout-session', authenticate, paiementController.createCheckoutSession);

// Vérifier le statut d'une session (authentifié)
router.get('/session/:session_id', authenticate, paiementController.checkSessionStatus);

// Webhook Stripe (pas d'authentification - Stripe envoie la requête)
// IMPORTANT: Cette route doit utiliser express.raw() au lieu de express.json()
// Cela sera configuré dans server.js avant les autres middlewares
router.post('/webhook', paiementController.stripeWebhook);

module.exports = router;
