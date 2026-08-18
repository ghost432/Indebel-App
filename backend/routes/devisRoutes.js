const express = require('express');
const router = express.Router();
const devisController = require('../controllers/devisController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Routes publiques
router.post('/create', devisController.createDemandeDevis);
router.get('/categories', devisController.getCategories);
router.get('/valides', devisController.getDevisValides);
router.get('/public/:id/status', devisController.getPublicDemandeStatus);
router.get('/public/:id', devisController.getPublicDemandeById);

// Routes authentifiées
router.get('/mes-demandes', authenticate, devisController.getMesDemandes);

// Routes admin
router.get('/stats', authenticate, isAdmin, devisController.getDevisStats);
router.get('/all', authenticate, isAdmin, devisController.getAllDemandes);
router.get('/:id/visibility', authenticate, isAdmin, devisController.getDevisVisibility);
router.get('/:id', authenticate, isAdmin, devisController.getDemandeById);
router.put('/:id/valider', authenticate, isAdmin, devisController.validerDemande);
router.put('/:id/refuser', authenticate, isAdmin, devisController.refuserDemande);
router.put('/:id/traiter', authenticate, isAdmin, devisController.marquerTraitee);
router.put('/:id/retirer-liste', authenticate, isAdmin, devisController.marquerRetireeListe);
router.put('/:id/attente', authenticate, isAdmin, devisController.marquerAttente);

router.delete('/:id', authenticate, isAdmin, devisController.deleteDemande);

module.exports = router;
