const express = require('express');
const router = express.Router();
const dashboardStatsController = require('../controllers/dashboardStatsController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/extra', authenticate, isAdmin, dashboardStatsController.getExtraStats);

module.exports = router;
