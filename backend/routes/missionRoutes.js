const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');
const { authenticate } = require('../middleware/auth');

// Route publique (sans auth)
router.get('/', missionController.getMissionsPubliques);
router.get('/publiques', missionController.getMissionsPubliques);
router.get('/public/:type/:id', missionController.getMissionPubliqueById);

// Routes missions
router.post('/hourly', authenticate, missionController.createMissionHourly);
router.post('/fixed', authenticate, missionController.createMissionFixed);
router.get('/all', authenticate, missionController.getAllMissions);
router.get('/employer', authenticate, missionController.getEmployerMissions);
router.get('/stats', authenticate, missionController.getMissionStats);
router.get('/disponibles', authenticate, missionController.getMissionsDisponibles);
router.post('/ignorer', authenticate, missionController.ignorerMission);
router.put('/:id/status', authenticate, missionController.updateMissionStatus);
router.delete('/:id', authenticate, missionController.deleteMission);
router.post('/:id/view', authenticate, missionController.logMissionViewAction);

module.exports = router;
