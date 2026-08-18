const db = require('../config/database');

const normalizeOptionalInt = value => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
};

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
      duree,
      type_facturation,
      duree_abonnement_mois,
      duree_offre_jours,
      logo_page_accueil,
      gestion_candidatures,
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
      couleur_badge,
      peut_publier_missions,
      label_indebel,
      liste_freelancers,
      liste_employeurs
    } = req.body;

    // Déterminer duree_abonnement_mois à partir de duree si non fourni
    const dureeMoisCalc = duree_abonnement_mois ||
      (duree === 'annuel' ? 12 : duree === 'semestriel' ? 6 : duree === 'trimestriel' ? 3 : 1);

    const [result] = await db.query(
      `INSERT INTO forfaits (
        nom, description, prix_mensuel, prix_annuel, duree, type_facturation,
        duree_abonnement_mois, duree_offre_jours, logo_page_accueil, gestion_candidatures,
        max_missions, max_documents, max_postulations, max_devis, limite_devis_ia, limite_candidature_ia, max_vues_missions, max_vues_devis, peut_voir_devis,
        max_demandes_devis, max_devis_recus, max_candidatures_recues,
        priorite_support, badge_premium, mise_en_avant, statistiques_avancees, api_access,
        type_utilisateur, actif, recommande, couleur_badge, peut_publier_missions, label_indebel,
        liste_freelancers, liste_employeurs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nom, description, prix_mensuel, prix_annuel,
        duree || 'mensuel',
        type_facturation || 'mensuel',
        dureeMoisCalc, duree_offre_jours || null,
        logo_page_accueil || false, gestion_candidatures || false,
        normalizeOptionalInt(req.body.max_missions), normalizeOptionalInt(req.body.max_documents),
        normalizeOptionalInt(req.body.max_postulations),
        normalizeOptionalInt(req.body.max_devis),
        normalizeOptionalInt(req.body.limite_devis_ia),
        normalizeOptionalInt(req.body.limite_candidature_ia),
        normalizeOptionalInt(req.body.max_vues_missions),
        normalizeOptionalInt(req.body.max_vues_devis),
        req.body.peut_voir_devis !== undefined ? !!req.body.peut_voir_devis : true,
        normalizeOptionalInt(req.body.max_demandes_devis),
        normalizeOptionalInt(req.body.max_devis_recus),
        normalizeOptionalInt(req.body.max_candidatures_recues),
        priorite_support || 'standard',
        badge_premium || false,
        mise_en_avant || false,
        statistiques_avancees || false,
        api_access || false,
        type_utilisateur,
        actif !== undefined ? actif : true,
        recommande || false,
        couleur_badge || '#6B7280',
        peut_publier_missions !== undefined ? peut_publier_missions : false,
        label_indebel !== undefined ? label_indebel : false,
        liste_freelancers !== undefined ? liste_freelancers : false,
        liste_employeurs !== undefined ? liste_employeurs : false
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
      duree,
      type_facturation,
      duree_abonnement_mois,
      duree_offre_jours,
      logo_page_accueil,
      gestion_candidatures,
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
      couleur_badge,
      peut_publier_missions,
      liste_freelancers,
      liste_employeurs,
      label_indebel
    } = req.body;

    // Déterminer duree_abonnement_mois à partir de duree si non fourni
    const dureeMoisCalc = duree_abonnement_mois != null ? duree_abonnement_mois :
      (duree === 'annuel' ? 12 : duree === 'semestriel' ? 6 : duree === 'trimestriel' ? 3 : 1);

    const [result] = await db.query(
      `UPDATE forfaits SET
        nom = ?,
        description = ?,
        prix_mensuel = ?,
        prix_annuel = ?,
        duree = ?,
        type_facturation = ?,
        duree_abonnement_mois = ?,
        duree_offre_jours = ?,
        logo_page_accueil = ?,
        gestion_candidatures = ?,
        max_missions = ?,
        max_documents = ?,
        max_postulations = ?,
        max_devis = ?,
        limite_devis_ia = ?,
        limite_candidature_ia = ?,
        max_vues_missions = ?,
        max_vues_devis = ?,
        peut_voir_devis = ?,
        max_demandes_devis = ?,
        max_devis_recus = ?,
        max_candidatures_recues = ?,
        priorite_support = ?,
        badge_premium = ?,
        mise_en_avant = ?,
        statistiques_avancees = ?,
        api_access = ?,
        type_utilisateur = ?,
        actif = ?,
        recommande = ?,
        couleur_badge = ?,
        peut_publier_missions = ?,
        label_indebel = ?,
        liste_freelancers = ?,
        liste_employeurs = ?
      WHERE id = ?`,
      [
        nom, description, prix_mensuel, prix_annuel,
        duree || 'mensuel',
        type_facturation || 'mensuel',
        dureeMoisCalc, duree_offre_jours, logo_page_accueil, gestion_candidatures,
        normalizeOptionalInt(req.body.max_missions), normalizeOptionalInt(req.body.max_documents),
        normalizeOptionalInt(req.body.max_postulations),
        normalizeOptionalInt(req.body.max_devis),
        normalizeOptionalInt(req.body.limite_devis_ia),
        normalizeOptionalInt(req.body.limite_candidature_ia),
        normalizeOptionalInt(req.body.max_vues_missions),
        normalizeOptionalInt(req.body.max_vues_devis),
        req.body.peut_voir_devis !== undefined ? !!req.body.peut_voir_devis : true,
        normalizeOptionalInt(req.body.max_demandes_devis),
        normalizeOptionalInt(req.body.max_devis_recus),
        normalizeOptionalInt(req.body.max_candidatures_recues),
        priorite_support, badge_premium, mise_en_avant, statistiques_avancees, api_access,
        type_utilisateur,
        actif, recommande, couleur_badge,
        peut_publier_missions !== undefined ? peut_publier_missions : false,
        label_indebel !== undefined ? label_indebel : false,
        liste_freelancers !== undefined ? liste_freelancers : false,
        liste_employeurs !== undefined ? liste_employeurs : false,
        id
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

    // Récupérer les utilisateurs ayant ce forfait
    const [users] = await db.query(
      'SELECT id, role FROM users WHERE forfait_id = ?',
      [id]
    );

    if (users.length > 0) {
      // Trouver les forfaits gratuits par défaut
      const [freeForfaits] = await db.query('SELECT id, type_utilisateur FROM forfaits WHERE prix_mensuel = 0 OR prix_mensuel IS NULL');
      
      const defaultFreelancer = freeForfaits.find(f => f.type_utilisateur === 'freelancer' || f.type_utilisateur === 'les_deux')?.id || null;
      const defaultEmployer = freeForfaits.find(f => f.type_utilisateur === 'employer' || f.type_utilisateur === 'les_deux')?.id || null;
      
      // Réaffecter chaque utilisateur à un forfait gratuit (ou NULL)
      for (const user of users) {
        const freeId = user.role === 'freelancer' ? defaultFreelancer : (user.role === 'employer' ? defaultEmployer : null);
        await db.query('UPDATE users SET forfait_id = ? WHERE id = ?', [freeId, user.id]);
      }
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
      message: 'Forfait supprimé avec succès. Les utilisateurs ont été basculés vers un forfait gratuit.'
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

    const forfait = forfaits[0];

    // Calculer la date d'expiration depuis duree (ENUM) ou duree_abonnement_mois
    let dureeMois = forfait.duree_abonnement_mois;
    if (dureeMois == null) {
      dureeMois = forfait.duree === 'annuel' ? 12
        : forfait.duree === 'semestriel' ? 6
        : forfait.duree === 'trimestriel' ? 3
        : 1;
    }

    // Si dureeMois === 0, c'est à vie (pas d'expiration)
    let formattedExpirationDate = null;
    if (dureeMois > 0) {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + dureeMois);
      formattedExpirationDate = expirationDate.toISOString().split('T')[0];
    }

    // Mettre à jour le forfait de l'utilisateur
    await db.query(
      `UPDATE users SET
        forfait_id = ?,
        forfait_date_debut = CURDATE(),
        forfait_date_expiration = ?,
        forfait_statut = 'actif'
      WHERE id = ?`,
      [forfait_id, formattedExpirationDate, target_user_id]
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
        u.forfait_date_debut as forfait_date_souscription,
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
    const { getEffectiveForfait, getMonthlyAiCounter } = require('../services/devisViewLimitService');

    const [users] = await db.query(
      `SELECT 
        u.forfait_id,
        u.forfait_date_debut as forfait_date_souscription,
        u.forfait_date_expiration,
        u.compteur_devis_ia,
        f.nom as forfait_nom,
        f.limite_devis_ia,
        f.limite_candidature_ia,
        f.max_devis,
        f.max_vues_missions,
        f.max_vues_devis,
        f.peut_voir_devis
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
    user.compteur_devis_ia = await getMonthlyAiCounter(user_id);
    const now = new Date();
    let expired = true;

    // Vérifier si l'utilisateur a un forfait et s'il est expiré
    if (user.forfait_id && user.forfait_date_expiration) {
      const dateExpiration = new Date(user.forfait_date_expiration);
      expired = now > dateExpiration;
    }

    // Obtenir le forfait effectif (avec fallback gratuit si expiré ou inexistant)
    const effective = await getEffectiveForfait(user_id);

    // Compter le nombre de devis déjà consultés
    const [viewCountRows] = await db.query(
      `SELECT COUNT(DISTINCT demande_devis_id) as count 
       FROM devis_page_views 
       WHERE user_id = ? 
         AND COALESCE(source, 'detail') IN ('detail', 'freelancer_detail', 'public_detail')
         AND viewed_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`,
      [user_id]
    );
    const viewed_count = Number(viewCountRows[0]?.count || 0);

    const [missionViewCountRows] = await db.query(
      `SELECT COUNT(DISTINCT mission_id) as count
       FROM mission_page_views
       WHERE user_id = ?
         AND viewed_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`,
      [user_id]
    );
    const mission_viewed_count = Number(missionViewCountRows[0]?.count || 0);

    res.json({
      success: true,
      expired,
      forfait: {
        id: effective ? effective.id : user.forfait_id,
        nom: effective ? effective.nom : user.forfait_nom,
        date_souscription: user.forfait_date_souscription,
        date_expiration: user.forfait_date_expiration,
        limite_devis_ia: effective ? effective.limite_devis_ia : user.limite_devis_ia,
        limite_candidature_ia: effective ? effective.limite_candidature_ia : user.limite_candidature_ia,
        compteur_devis_ia: user.compteur_devis_ia,
        max_devis: effective ? effective.max_devis : user.max_devis,
        max_vues_missions: effective ? effective.max_vues_missions : user.max_vues_missions,
        max_vues_devis: effective ? effective.max_vues_devis : user.max_vues_devis,
        peut_voir_devis: effective ? effective.peut_voir_devis : user.peut_voir_devis,
        viewed_count: viewed_count,
        mission_viewed_count
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
