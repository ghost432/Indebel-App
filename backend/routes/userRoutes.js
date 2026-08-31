const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes statiques d'abord (doivent être avant les routes avec paramètres)

const authController = require('../controllers/authController');

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticate, authController.getCurrentUser);

// Route pour admin: obtenir TOUS les utilisateurs sans filtre
router.get('/all', authenticate, authorize('admin'), userController.getAllUsers);

// Routes admin pour la vérification BCE
router.get('/admin/bce', authenticate, authorize('admin'), userController.getAdminBceList);
router.get('/admin/bce/candidates', authenticate, authorize('admin'), userController.getAdminBceCandidates);
router.post('/admin/bce/request/:userId', authenticate, authorize('admin'), userController.requestBceVerification);
router.post('/admin/bce/validate/:userId', authenticate, authorize('admin'), userController.adminValidateBce);

// Route utilisateur pour vérifier et sauvegarder son propre numéro BCE
router.post('/verify-and-update-bce', authenticate, userController.verifyAndUpdateBce);

// Routes administrateur uniquement
router.get('/stats', authenticate, authorize('admin'), userController.getUserStats);
router.get('/stats/access', authenticate, authorize('admin'), userController.getAccessStats);
router.get('/stats/by-city', authenticate, authorize('admin'), userController.getUserStatsByCity);
router.post('/subadmin', authenticate, authorize('admin'), userController.createSubAdmin);
router.post('/create', authenticate, authorize('admin'), userController.createUserByAdmin);

// Public routes
router.get('/check-bce/:bceNumber', userController.checkBceNumber);
router.get('/verify-bce/:bceNumber', userController.verifyBceWithAPI);
router.get('/public-profile/:identifier', userController.getPublicProfile);

const { getEffectiveForfait } = require('../services/devisViewLimitService');

// Route pour obtenir la liste des utilisateurs (avec filtres automatiques)
router.get('/', authenticate, async (req, res, next) => {
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

// Routes statiques PUT
router.put('/profile', authenticate, userController.updateUser);
router.put('/change-password', authenticate, userController.changePassword);

// Routes avec paramètres (après les routes statiques)
router.get('/:id/completed-missions', userController.getFreelancerCompletedMissions);
router.get('/:id/published-missions', userController.getEmployerPublishedMissions);

// Routes protégées
router.get('/:id', authenticate, userController.getUserById);
router.post('/:id/prolonge-forfait', authenticate, authorize('admin'), userController.prolongeForfait);
router.put('/:id', authenticate, authorize('admin', 'employer', 'freelancer'), userController.updateUser);

module.exports = router;
