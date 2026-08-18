const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', authenticate, isAdmin, seoController.getSeoSettings);
router.put('/', authenticate, isAdmin, seoController.updateSeoSettings);

module.exports = router;
