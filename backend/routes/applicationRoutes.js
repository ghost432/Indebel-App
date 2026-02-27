const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const { applicationValidation, validate } = require('../middleware/validator');

// Freelancer routes
router.post('/', authenticate, authorize('freelancer'), applicationValidation, validate, applicationController.createApplication);
router.get('/my-applications', authenticate, authorize('freelancer'), applicationController.getFreelancerApplications);

// Employer routes
router.get('/job/:job_id', authenticate, authorize('employer', 'admin'), applicationController.getJobApplications);
router.put('/:id/status', authenticate, authorize('employer', 'admin'), applicationController.updateApplicationStatus);
router.put('/:id/reject', authenticate, authorize('employer', 'admin'), applicationController.rejectApplicationWithReason);

// Admin routes
router.get('/stats', authenticate, authorize('admin'), applicationController.getApplicationStats);
router.get('/by-period', authenticate, authorize('admin'), applicationController.getApplicationsByPeriod);

module.exports = router;
