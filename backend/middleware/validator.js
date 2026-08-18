const { body, validationResult } = require('express-validator');

// Validation error handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules
exports.registerValidation = [
  body('nom').optional({ checkFalsy: true }).trim(),
  body('email').isEmail().withMessage('Email invalide'),
  body('mot_de_passe')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role')
    .isIn(['freelancer', 'employer', 'admin'])
    .withMessage('Le rôle doit être freelancer, employer ou admin')
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('mot_de_passe').notEmpty().withMessage('Le mot de passe est requis')
];

exports.jobValidation = [
  body('titre').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('statut')
    .optional()
    .isIn(['ouvert', 'ferme', 'en_cours'])
    .withMessage('Statut invalide')
];

exports.applicationValidation = [
  body('job_id').isInt().withMessage('ID de l\'offre invalide')
];
