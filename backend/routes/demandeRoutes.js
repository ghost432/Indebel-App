const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demandeController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes demandes de missions
router.post('/create', authenticate, demandeController.createDemande);
router.get('/employer', authenticate, demandeController.getEmployerDemandes);
router.get('/freelancer', authenticate, demandeController.getFreelancerDemandes);
router.get('/counts', authenticate, demandeController.getDemandesCountByMission);
router.put('/accepter/:id', authenticate, demandeController.accepterDemande);
router.put('/refuser/:id', authenticate, demandeController.refuserDemande);
router.put('/terminer', authenticate, demandeController.terminerMission);

// Admin route
router.get('/all', authenticate, authorize('admin'), demandeController.getAllDemandes);

module.exports = router;
