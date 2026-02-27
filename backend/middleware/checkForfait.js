const db = require('../config/database');

// Middleware pour vérifier si le forfait est expiré
const checkForfaitExpired = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const [users] = await db.query(
      'SELECT forfait_id, forfait_date_expiration FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const user = users[0];
    
    // Si pas de forfait, bloquer
    if (!user.forfait_id || !user.forfait_date_expiration) {
      return res.status(403).json({
        success: false,
        expired: true,
        message: 'Vous devez souscrire à un forfait pour effectuer cette action'
      });
    }
    
    // Vérifier si expiré
    const now = new Date();
    const dateExpiration = new Date(user.forfait_date_expiration);
    
    if (now > dateExpiration) {
      return res.status(403).json({
        success: false,
        expired: true,
        message: 'Votre forfait a expiré. Veuillez le renouveler pour continuer.'
      });
    }
    
    // Forfait valide, continuer
    next();
  } catch (error) {
    console.error('Erreur vérification forfait:', error);
    next(error);
  }
};

module.exports = { checkForfaitExpired };
