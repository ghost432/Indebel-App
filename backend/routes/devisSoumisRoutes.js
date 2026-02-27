const express = require('express');
const router = express.Router();
const devisSoumisController = require('../controllers/devisSoumisController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Routes freelancer
router.get('/disponibles', authenticate, devisSoumisController.getDemandesDisponibles);
router.post('/soumettre', authenticate, devisSoumisController.soumettreDevis);
router.get('/mes-devis', authenticate, devisSoumisController.getMesDevisSoumis);

// Routes admin
router.post('/notifier/:demandeId', authenticate, isAdmin, devisSoumisController.notifierFreelancersQualifies);
router.get('/demande/:demandeId', authenticate, devisSoumisController.getDevisPourDemande);
router.get('/demande-disponible/:id', authenticate, devisSoumisController.getDemandeByIdForFreelancer);

module.exports = router;
