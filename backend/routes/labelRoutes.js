const express = require('express');
const router = express.Router();
const multer = require('multer');
const labelController = require('../controllers/labelController');
const { authenticate, authorize } = require('../middleware/auth');
const path = require('path');

// Configuration multer pour les uploads de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/label-requests/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Types de fichiers autorisés
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Routes publiques (avec authentification)
router.get('/eligibility', authenticate, labelController.getEligibility);
router.post('/exceptional-request', authenticate, upload.any(), labelController.submitExceptionalRequest);
router.get('/exceptional-request/status', authenticate, labelController.getExceptionalRequestStatus);
router.get('/statut/:userId?', authenticate, labelController.getStatutLabel);
router.get('/demande-en-attente', authenticate, labelController.getDemandeEnAttente);
router.post('/verifier-criteres/:userId?', authenticate, labelController.verifierCriteres);
router.post('/repondre', authenticate, labelController.repondreLabel);

// Routes admin
router.post('/demander', authenticate, authorize('admin', 'freelancer', 'employer'), labelController.demanderLabel);
router.get('/admin/liste', authenticate, authorize('admin'), labelController.getUsersAvecLabel);
router.delete('/admin/revoquer/:labelId', authenticate, authorize('admin'), labelController.revoquerLabel);

// Nouvelles routes admin pour les utilisateurs éligibles et demandes exceptionnelles
router.get('/eligible-users', authenticate, authorize('admin'), labelController.getEligibleUsers);
router.post('/grant/:userId', authenticate, authorize('admin'), labelController.grantLabel);
router.delete('/revoke/:userId', authenticate, authorize('admin'), labelController.revokeUserLabel);
router.get('/exceptional-requests', authenticate, authorize('admin'), labelController.getExceptionalRequests);
router.post('/exceptional-requests/:requestId/approve', authenticate, authorize('admin'), labelController.approveExceptionalRequest);
router.post('/exceptional-requests/:requestId/reject', authenticate, authorize('admin'), labelController.rejectExceptionalRequest);

// Route pour télécharger l'image du label
router.get('/download-image', (req, res) => {
  const imagePath = path.join(__dirname, '../public/images/label-indebel.svg');
  res.download(imagePath, 'label-indebel.svg', (err) => {
    if (err) {
      console.error('Erreur téléchargement image label:', err);
      res.status(404).json({ success: false, message: 'Image non trouvée' });
    }
  });
});

module.exports = router;
