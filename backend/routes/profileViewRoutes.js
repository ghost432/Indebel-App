const express = require('express');
const router = express.Router();
const profileViewController = require('../controllers/profileViewController');
const { authenticate } = require('../middleware/auth');

// Route publique pour enregistrer une vue (peut être appelée par utilisateurs non connectés)
router.post('/track', profileViewController.trackProfileView);

// Routes protégées pour les statistiques (nécessitent une authentification)
router.get('/stats', authenticate, profileViewController.getProfileViewStats);
router.get('/detailed', authenticate, profileViewController.getDetailedViews);

module.exports = router;
