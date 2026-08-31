const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticate } = require('../middleware/auth');

// Routes pour les évaluations
router.post('/create', authenticate, evaluationController.createEvaluation);
router.post('/', authenticate, evaluationController.createEvaluation);
router.get('/freelancer/me', authenticate, (req, res, next) => {
  req.params.freelancer_id = req.user.id;
  return evaluationController.getFreelancerEvaluations(req, res, next);
});
router.get('/freelancer/:freelancer_id', evaluationController.getFreelancerEvaluations);
router.get('/employer', authenticate, evaluationController.getEmployerEvaluations);
router.post('/terminer-freelancer', authenticate, evaluationController.terminerMissionFreelancer);

// Routes admin
router.get('/admin/list', authenticate, evaluationController.getAdminEvaluations);
router.put('/admin/:id', authenticate, evaluationController.updateAdminEvaluation);
router.delete('/admin/:id', authenticate, evaluationController.deleteAdminEvaluation);

module.exports = router;
