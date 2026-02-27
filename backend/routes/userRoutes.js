const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes statiques d'abord (doivent être avant les routes avec paramètres)

// Route pour admin: obtenir TOUS les utilisateurs sans filtre
router.get('/all', authenticate, authorize('admin'), userController.getAllUsers);

// Routes administrateur uniquement
router.get('/stats', authenticate, authorize('admin'), userController.getUserStats);
router.get('/stats/by-city', authenticate, authorize('admin'), userController.getUserStatsByCity);

// Public routes
router.get('/check-bce/:bceNumber', userController.checkBceNumber);
router.get('/verify-bce/:bceNumber', userController.verifyBceWithAPI);
router.get('/public-profile/:identifier', userController.getPublicProfile);

// Route pour obtenir la liste des utilisateurs (avec filtres automatiques)
router.get('/', authenticate, (req, res, next) => {
  // Autoriser les admins, employeurs et freelancers à voir la liste des utilisateurs
  if (req.user.role === 'admin' || req.user.role === 'employer' || req.user.role === 'freelancer') {
    // Si c'est un freelancer, on filtre pour ne renvoyer que les employeurs
    if (req.user.role === 'freelancer') {
      req.query.role = 'employer';
      req.query.verifiedOnly = 'true';
    }
    return userController.getAllUsers(req, res, next);
  }
  return res.status(403).json({ success: false, message: 'Accès non autorisé' });
});

router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);
router.put('/employers/verify-all', authenticate, authorize('admin'), userController.verifyAllEmployers);
router.put('/employers/verify-all-and-set-image', authenticate, authorize('admin'), userController.verifyAllEmployersAndSetImage);

// Routes avec paramètres (après les routes statiques)
router.get('/:employerId/published-missions', userController.getPublishedMissions);
router.get('/:id/completed-missions', userController.getFreelancerCompletedMissions);
router.get('/:id/published-missions', userController.getEmployerPublishedMissions);

// Routes protégées
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, authorize('admin', 'employer', 'freelancer'), userController.updateUser);
router.put('/change-password', authenticate, userController.changePassword);

module.exports = router;
