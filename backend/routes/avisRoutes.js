const express = require('express');
const router = express.Router();
const avisController = require('../controllers/avisController');
const { authenticate, authorize } = require('../middleware/auth');

// ── Routes publiques (sans authentification) ──────────────────────────────────
// Lister les freelancers avec leurs notes moyennes
router.get('/freelancers', avisController.listFreelancers);
// Avis d'un freelancer spécifique
router.get('/freelancer/:freelancer_id', avisController.getFreelancerAvis);
// Soumettre un avis (particulier - pas besoin d'être connecté)
router.post('/create', avisController.createAvis);
// Avis reçus par le prestataire connecté
router.get('/me', authenticate, authorize('freelancer'), avisController.getMyAvis);

// ── Routes admin (authentification + rôle admin requis) ──────────────────────
router.get('/admin/list', authenticate, authorize('admin'), avisController.adminListAvis);
router.put('/admin/:id', authenticate, authorize('admin'), avisController.adminUpdateAvis);
router.delete('/admin/:id', authenticate, authorize('admin'), avisController.adminDeleteAvis);

module.exports = router;
