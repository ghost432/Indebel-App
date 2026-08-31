const express = require('express');
const router = express.Router();
const adminCreditsController = require('../controllers/adminCreditsController');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET settings/price allows any authenticated user (employer, freelancer, admin) to read credit cost config
router.get('/settings/price', authenticate, adminCreditsController.getSettings);
router.post('/settings/price', authenticate, isAdmin, adminCreditsController.updateSettings);
router.post('/users/balance', authenticate, isAdmin, adminCreditsController.updateUserBalance);
router.post('/give-free-credits-all', authenticate, isAdmin, adminCreditsController.giveFreeCreditsToAll);

module.exports = router;
