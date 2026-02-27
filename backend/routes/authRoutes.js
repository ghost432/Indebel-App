const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation, validate } = require('../middleware/validator');

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/check-email', authController.checkEmail);

// OTP routes
router.post('/otp/send', otpController.sendOTP);
router.post('/otp/verify', otpController.verifyOTP);
router.post('/otp/resend', otpController.resendOTP);

// Password reset routes
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
