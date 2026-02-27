const db = require('../config/database');

// Récupérer tous les forfaits (Public/Authenticated)
exports.getAllForfaits = async (req, res, next) => {
  try {
    const { type_utilisateur } = req.query;
    
    let query = 'SELECT * FROM forfaits WHERE actif = TRUE';
    const params = [];
    
    if (type_utilisateur) {
      query += ' AND (type_utilisateur = ? OR type_utilisateur = "les_deux")';
      params.push(type_utilisateur);
    }
    
    query += ' ORDER BY prix_mensuel ASC';
    
    const [forfaits] = await db.query(query, params);
    
    res.json({
      success: true,
      data: forfaits
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer un forfait par ID
exports.getForfaitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [forfaits] = await db.query(
      'SELECT * FROM forfaits WHERE id = ?',
      [id]
    );
    
    if (forfaits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forfait non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: forfaits[0]
    });
  } catch (error) {
    next(error);
  }
};

// Créer un forfait (Admin uniquement)
exports.createForfait = async (req, res, next) => {
  try {
    const {
      nom,
      description,
      prix_mensuel,
      prix_annuel,
      max_missions,
      max_documents,
      priorite_support,
      badge_premium,
      mise_en_avant,
      statistiques_avancees,
      api_access,
      type_utilisateur,
      actif,
      recommande,
      couleur_badge
    } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO forfaits (
        nom, description, prix_mensuel, prix_annuel, max_missions, max_documents,
        priorite_support, badge_premium, mise_en_avant, statistiques_avancees, api_access,
        type_utilisateur, actif, recommande, couleur_badge
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nom, description, prix_mensuel, prix_annuel, max_missions, max_documents,
        priorite_support || 'standard',
        badge_premium || false,
        mise_en_avant || false,
        statistiques_avancees || false,
        api_access || false,
        type_utilisateur,
        actif !== undefined ? actif : true,
        recommande || false,
        couleur_badge || '#6B7280'
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Forfait créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour un forfait (Admin uniquement)
exports.updateForfait = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nom,
      description,
      prix_mensuel,
      prix_annuel,
      max_missions,
      max_documents,
      priorite_support,
      badge_premium,
      mise_en_avant,
      statistiques_avancees,
      api_access,
      type_utilisateur,
      actif,
      recommande,
      couleur_badge
    } = req.body;
    
    const [result] = await db.query(
      `UPDATE forfaits SET
        nom = ?,
        description = ?,
        prix_mensuel = ?,
        prix_annuel = ?,
        max_missions = ?,
        max_documents = ?,
        priorite_support = ?,
        badge_premium = ?,
        mise_en_avant = ?,
        statistiques_avancees = ?,
        api_access = ?,
        type_utilisateur = ?,
        actif = ?,
        recommande = ?,
        couleur_badge = ?
      WHERE id = ?`,
      [
        nom, description, prix_mensuel, prix_annuel, max_missions, max_documents,
        priorite_support, badge_premium, mise_en_avant, statistiques_avancees, api_access,
        type_utilisateur, actif, recommande, couleur_badge, id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forfait non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Forfait mis à jour avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un forfait (Admin uniquement)
exports.deleteForfait = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Vérifier si des utilisateurs ont ce forfait
    const [users] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE forfait_id = ?',
      [id]
    );
    
    if (users[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce forfait. ${users[0].count} utilisateur(s) l'utilisent actuellement.`
      });
    }
    
    const [result] = await db.query(
      'DELETE FROM forfaits WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forfait non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Forfait supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Changer le forfait d'un utilisateur (User ou Admin)
exports.changeForfaitUtilisateur = async (req, res, next) => {
  try {
    const { user_id, forfait_id } = req.body;
    const requesting_user = req.user;
    
    // Si ce n'est pas un admin, on peut seulement changer son propre forfait
    const target_user_id = requesting_user.role === 'admin' ? user_id : requesting_user.id;
    
    if (!target_user_id || !forfait_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id et forfait_id sont requis'
      });
    }
    
    // Vérifier que le forfait existe
    const [forfaits] = await db.query(
      'SELECT * FROM forfaits WHERE id = ? AND actif = TRUE',
      [forfait_id]
    );
    
    if (forfaits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forfait non trouvé ou inactif'
      });
    }
    
    // Mettre à jour le forfait de l'utilisateur
    await db.query(
      `UPDATE users SET
        forfait_id = ?,
        forfait_date_debut = CURDATE(),
        forfait_statut = 'actif'
      WHERE id = ?`,
      [forfait_id, target_user_id]
    );
    
    res.json({
      success: true,
      message: 'Forfait mis à jour avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer le forfait actuel d'un utilisateur
exports.getForfaitUtilisateur = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    
    const [users] = await db.query(
      `SELECT 
        u.forfait_id,
        u.forfait_date_souscription,
        u.forfait_date_expiration,
        u.forfait_statut,
        f.*
      FROM users u
      LEFT JOIN forfaits f ON u.forfait_id = f.id
      WHERE u.id = ?`,
      [user_id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
};

// Vérifier le statut du forfait (expiré ou non)
exports.checkForfaitStatus = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    
    const [users] = await db.query(
      `SELECT 
        u.forfait_id,
        u.forfait_date_souscription,
        u.forfait_date_expiration,
        f.nom as forfait_nom
      FROM users u
      LEFT JOIN forfaits f ON u.forfait_id = f.id
      WHERE u.id = ?`,
      [user_id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const user = users[0];
    const now = new Date();
    let expired = true;
    
    // Vérifier si l'utilisateur a un forfait et s'il est expiré
    if (user.forfait_id && user.forfait_date_expiration) {
      const dateExpiration = new Date(user.forfait_date_expiration);
      expired = now > dateExpiration;
    }
    
    res.json({
      success: true,
      expired,
      forfait: {
        id: user.forfait_id,
        nom: user.forfait_nom,
        date_souscription: user.forfait_date_souscription,
        date_expiration: user.forfait_date_expiration
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
