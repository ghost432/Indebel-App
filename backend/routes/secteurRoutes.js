const express = require('express');
const router = express.Router();
const secteurController = require('../controllers/secteurController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes publiques (pour les formulaires)
router.get('/with-competences', secteurController.getAllSecteursWithCompetences);

// Routes admin uniquement
router.get('/', authenticate, authorize('admin'), secteurController.getAllSecteurs);
router.post('/', authenticate, authorize('admin'), secteurController.createSecteur);
router.put('/:id', authenticate, authorize('admin'), secteurController.updateSecteur);
router.delete('/:id', authenticate, authorize('admin'), secteurController.deleteSecteur);

// Routes compétences
router.get('/:secteurId/competences', secteurController.getCompetencesBySecteur);
router.post('/competences', authenticate, authorize('admin'), secteurController.createCompetence);
router.put('/competences/:id', authenticate, authorize('admin'), secteurController.updateCompetence);
router.delete('/competences/:id', authenticate, authorize('admin'), secteurController.deleteCompetence);

module.exports = router;
