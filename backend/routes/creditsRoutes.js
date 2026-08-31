const express = require('express');
const router = express.Router();
const creditsController = require('../controllers/creditsController');
const adminCreditsController = require('../controllers/adminCreditsController');
const { authenticate } = require('../middleware/auth');

router.get('/balance', authenticate, creditsController.getCreditsBalance);
router.get('/historique', authenticate, creditsController.getHistorique);
router.get('/settings/price', authenticate, adminCreditsController.getSettings);
router.get('/price', authenticate, adminCreditsController.getSettings);
router.post('/buy', authenticate, creditsController.buyCredits);
router.post('/consume', authenticate, creditsController.consumeCredits);

module.exports = router;
