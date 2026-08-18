const db = require('../config/database');

const normalizeLimit = value => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
};

const isExpired = user => {
  if (!user) return true;
  if (user.forfait_statut && user.forfait_statut !== 'actif') return true;
  if (!user.forfait_date_expiration) return false;
  return new Date(user.forfait_date_expiration) < new Date();
};

const getFallbackFreeForfait = async () => {
  const [rows] = await db.query(
    `SELECT id, nom, max_devis, peut_voir_devis, limite_devis_ia
     FROM forfaits
     WHERE actif = 1
       AND type_utilisateur IN ('freelancer', 'les_deux')
       AND LOWER(nom) LIKE '%gratuit%'
     ORDER BY prix_mensuel ASC, id DESC
     LIMIT 1`
  );
  return rows[0] || { id: null, nom: 'Gratuit', max_devis: 10, peut_voir_devis: 1, limite_devis_ia: null };
};

const getEffectiveForfait = async userId => {
  const [users] = await db.query(
    `SELECT u.id, u.role, u.forfait_id, u.forfait_date_expiration, u.forfait_statut,
            f.nom as forfait_nom, f.max_devis, f.peut_voir_devis, f.actif as forfait_actif, f.limite_devis_ia
     FROM users u
     LEFT JOIN forfaits f ON f.id = u.forfait_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );

  const user = users[0];
  if (!user || user.role !== 'freelancer') return null;

  if (!user.forfait_id || !user.forfait_actif || isExpired(user)) {
    const free = await getFallbackFreeForfait();
    return {
      id: free.id,
      nom: free.nom || 'Gratuit',
      max_devis: normalizeLimit(free.max_devis),
      limite_devis_ia: normalizeLimit(free.limite_devis_ia),
      peut_voir_devis: Number(free.peut_voir_devis ?? 1),
      fallback: true
    };
  }

  return {
    id: user.forfait_id,
    nom: user.forfait_nom || 'Forfait actuel',
    max_devis: normalizeLimit(user.max_devis),
    limite_devis_ia: normalizeLimit(user.limite_devis_ia),
    peut_voir_devis: Number(user.peut_voir_devis ?? 1),
    fallback: false
  };
};

const getViewedStats = async (userId, demandeId) => {
  const [rows] = await db.query(
    `SELECT
       COUNT(DISTINCT demande_devis_id) as viewed_count,
       MAX(CASE WHEN demande_devis_id = ? THEN 1 ELSE 0 END) as already_viewed_current
     FROM devis_page_views
     WHERE user_id = ?
       AND COALESCE(source, 'detail') IN ('detail', 'freelancer_detail', 'public_detail')`,
    [demandeId, userId]
  );

  return {
    viewedCount: Number(rows[0]?.viewed_count || 0),
    alreadyViewedCurrent: Number(rows[0]?.already_viewed_current || 0) === 1
  };
};

const checkDevisViewAccess = async (req, demandeId) => {
  const user = req.user;
  if (!user || user.role !== 'freelancer') {
    return { allowed: true, limited: false };
  }

  const forfait = await getEffectiveForfait(user.id);
  if (Number(forfait?.peut_voir_devis ?? 1) !== 1) {
    return {
      allowed: false,
      limited: true,
      code: 'DEVIS_VIEW_LIMIT_REACHED',
      status: 403,
      forfait,
      limit: 0,
      viewedCount: 0,
      alreadyViewedCurrent: false,
      message: `Votre forfait ${forfait?.nom || ''} ne permet pas encore de voir les demandes de devis. Veuillez changer de forfait pour en voir plus.`
    };
  }

  const limit = normalizeLimit(forfait?.max_devis);
  const stats = await getViewedStats(user.id, demandeId);

  if (limit === null) {
    return { allowed: true, limited: false, forfait, limit: null, ...stats };
  }

  if (stats.alreadyViewedCurrent || stats.viewedCount < limit) {
    return { allowed: true, limited: true, forfait, limit, ...stats };
  }

  return {
    allowed: false,
    limited: true,
    code: 'DEVIS_VIEW_LIMIT_REACHED',
    status: 403,
    forfait,
    limit,
    ...stats,
    message: `Vous ne pouvez plus voir de demande de devis avec votre forfait ${forfait?.nom || ''}. Veuillez changer de forfait pour en voir plus.`
  };
};

const sendLimitReached = (res, access) => res.status(403).json({
  success: false,
  code: 'DEVIS_VIEW_LIMIT_REACHED',
  message: access.message || 'Vous ne pouvez plus voir de demande de devis. Veuillez changer de forfait pour en voir plus.',
  forfait: access.forfait || null,
  limit: access.limit,
  viewed_count: access.viewedCount,
  upgrade_url: '/freelancer/forfaits'
});

module.exports = {
  checkDevisViewAccess,
  sendLimitReached,
  normalizeLimit,
  getEffectiveForfait
};
