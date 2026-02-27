const express = require('express');
const router = express.Router();
const freelancerJobController = require('../controllers/freelancerJobController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour les prestataires
router.post('/hourly', authenticate, authorize('freelancer', 'admin'), freelancerJobController.createJobHourly);
router.post('/fixed', authenticate, authorize('freelancer', 'admin'), freelancerJobController.createJobFixed);
router.get('/my-jobs', authenticate, authorize('freelancer', 'admin'), freelancerJobController.getMyJobs);
router.put('/:id/close', authenticate, authorize('freelancer', 'admin'), freelancerJobController.closeJob);

// Routes pour admin
router.get('/all', authenticate, authorize('admin'), freelancerJobController.getAllFreelancerJobs);
router.put('/:id/status', authenticate, authorize('admin'), freelancerJobController.updateJobStatus);

module.exports = router;
