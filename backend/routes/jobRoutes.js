const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');
const { jobValidation, validate } = require('../middleware/validator');

// Public routes
router.get('/', jobController.getAllJobs);
router.get('/stats', authenticate, authorize('admin'), jobController.getJobStats);
router.get('/:id', jobController.getJobById);

// Employer & Authorized Freelancer routes
router.post('/', authenticate, authorize('employer', 'freelancer', 'admin'), jobValidation, validate, jobController.createJob);
router.get('/employer/my-jobs', authenticate, authorize('employer', 'freelancer', 'admin'), jobController.getEmployerJobs);
router.put('/:id', authenticate, authorize('employer', 'freelancer', 'admin'), jobValidation, validate, jobController.updateJob);
router.delete('/:id', authenticate, authorize('employer', 'freelancer', 'admin'), jobController.deleteJob);

// Admin routes for freelancer missions
router.get('/admin/freelancer-jobs', authenticate, authorize('admin'), jobController.getFreelancerJobsForAdmin);
router.post('/admin/freelancer-jobs/:id/approve', authenticate, authorize('admin'), jobController.approveFreelancerMission);
router.post('/admin/freelancer-jobs/:id/reject', authenticate, authorize('admin'), jobController.rejectFreelancerMission);

module.exports = router;
