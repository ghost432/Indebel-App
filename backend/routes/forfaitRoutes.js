const express = require('express');
const router = express.Router();
const forfaitController = require('../controllers/forfaitController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes publiques/authentifiées
router.get('/', authenticate, forfaitController.getAllForfaits);
router.get('/:id', authenticate, forfaitController.getForfaitById);

// Routes utilisateur
router.get('/me/forfait', authenticate, forfaitController.getForfaitUtilisateur);
router.get('/me/status', authenticate, forfaitController.checkForfaitStatus);
router.put('/me/change', authenticate, forfaitController.changeForfaitUtilisateur);

// Routes admin uniquement
router.post('/', authenticate, authorize('admin'), forfaitController.createForfait);
router.put('/:id', authenticate, authorize('admin'), forfaitController.updateForfait);
router.delete('/:id', authenticate, authorize('admin'), forfaitController.deleteForfait);

module.exports = router;
