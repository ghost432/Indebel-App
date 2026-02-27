const express = require('express');
const router = express.Router();
const pwaController = require('../controllers/pwaController');
const { authenticate, authorize } = require('../middleware/auth');

// Enregistrement installation (public ou authentifié)
router.post('/installation', pwaController.enregistrerInstallation);

// Enregistrement push subscription (public ou authentifié)
router.post('/push-subscription', pwaController.enregistrerPushSubscription);

// Routes admin
router.get('/admin/statistiques', authenticate, authorize('admin'), pwaController.getStatistiques);
router.get('/admin/installations', authenticate, authorize('admin'), pwaController.getInstallations);
router.get('/admin/push-stats', authenticate, authorize('admin'), pwaController.getPushStats);

module.exports = router;
