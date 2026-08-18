const express = require('express');
const router = express.Router();
const devisSoumisController = require('../controllers/devisSoumisController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Routes freelancer
router.get('/disponibles', authenticate, devisSoumisController.getDemandesDisponibles);
router.post('/soumettre', authenticate, devisSoumisController.soumettreDevis);
router.post('/generate-ai-devis', authenticate, devisSoumisController.generateAIDevis);
router.post('/suggest-price', authenticate, devisSoumisController.suggestPrice);
router.get('/mes-devis', authenticate, devisSoumisController.getMesDevisSoumis);

// Routes employeur
router.get('/recus', authenticate, devisSoumisController.getDevisRecusEmployer);
router.post('/marquer-lu/:id', authenticate, devisSoumisController.marquerCommeLu);

// Routes publiques (pour les clients consultant / acceptant / refusant leur devis)
router.get('/by-token', devisSoumisController.getDevisByToken);
router.post('/reponse-client', devisSoumisController.reponseClient);

// Routes admin
router.post('/notifier/:demandeId', authenticate, isAdmin, devisSoumisController.notifierFreelancersQualifies);
router.get('/admin/all', authenticate, isAdmin, devisSoumisController.getAllDevisSoumisAdmin);
router.get('/demande/:demandeId', authenticate, devisSoumisController.getDevisPourDemande);
router.get('/demande-disponible/:id', authenticate, devisSoumisController.getDemandeByIdForFreelancer);

module.exports = router;
