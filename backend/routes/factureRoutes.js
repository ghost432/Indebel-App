const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes utilisateur
router.get('/mes-factures', authenticate, factureController.getUserFactures);
router.get('/telecharger/:id', authenticate, factureController.telechargerFacture);

// Routes admin
router.get('/admin/toutes', authenticate, authorize('admin'), factureController.getAllFactures);
router.get('/admin/stats', authenticate, authorize('admin'), factureController.getStatsFactures);
router.post('/admin/generer-retroactives', authenticate, authorize('admin'), factureController.genererFacturesRetroactives);
router.post('/admin/credit-note/:id', authenticate, authorize('admin'), factureController.creerCreditNote);
router.get('/admin/credit-note/:id/telecharger', authenticate, authorize('admin'), factureController.telechargerCreditNote);
router.post('/admin/credit-note/:id/email', authenticate, authorize('admin'), factureController.envoyerCreditNoteMail);

module.exports = router;
