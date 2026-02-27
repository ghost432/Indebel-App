const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticate } = require('../middleware/auth');

// Routes pour les évaluations
router.post('/create', authenticate, evaluationController.createEvaluation);
router.get('/freelancer/:freelancer_id', evaluationController.getFreelancerEvaluations);
router.get('/employer', authenticate, evaluationController.getEmployerEvaluations);
router.post('/terminer-freelancer', authenticate, evaluationController.terminerMissionFreelancer);

module.exports = router;
