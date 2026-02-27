const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate } = require('../middleware/auth');

// Routes pour les freelancers
router.post('/submit', authenticate, verificationController.submitVerification);
router.get('/status', authenticate, verificationController.getVerificationStatus);

// Routes pour les admins
router.get('/all', authenticate, verificationController.getAllVerifications);
router.put('/validate/:verification_id', authenticate, verificationController.validateVerification);
router.put('/reject/:verification_id', authenticate, verificationController.rejectVerification);

module.exports = router;
