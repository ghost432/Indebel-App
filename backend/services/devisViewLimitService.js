const db = require('../config/database');

let ensureAiCounterColumnPromise = null;

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

const ensureAiCounterResetColumn = async () => {
  if (!ensureAiCounterColumnPromise) {
    ensureAiCounterColumnPromise = (async () => {
      const [columns] = await db.query(
        `SELECT COUNT(*) as count
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = 'compteur_devis_ia_reset_at'`
      );

      if (Number(columns[0]?.count || 0) === 0) {
        await db.query('ALTER TABLE users ADD COLUMN compteur_devis_ia_reset_at DATE NULL DEFAULT NULL');
      }
    })().catch(error => {
      ensureAiCounterColumnPromise = null;
      throw error;
    });
  }

  return ensureAiCounterColumnPromise;
};

const resetMonthlyAiCounterIfNeeded = async userId => {
  await ensureAiCounterResetColumn();
  await db.query(
    `UPDATE users
     SET compteur_devis_ia = 0,
         compteur_devis_ia_reset_at = CURRENT_DATE
     WHERE id = ?
       AND (
         compteur_devis_ia_reset_at IS NULL
         OR compteur_devis_ia_reset_at < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
       )`,
    [userId]
  );
};

const getMonthlyAiCounter = async userId => {
  await resetMonthlyAiCounterIfNeeded(userId);
  const [rows] = await db.query('SELECT compteur_devis_ia FROM users WHERE id = ?', [userId]);
  return Number(rows[0]?.compteur_devis_ia || 0);
};

const getFallbackFreeForfait = async (role) => {
  const [rows] = await db.query(
    `SELECT id, nom, max_devis, peut_voir_devis, limite_devis_ia, max_vues_missions, max_vues_devis, limite_candidature_ia, liste_freelancers, liste_employeurs, max_demandes_devis, max_devis_recus, max_candidatures_recues
     FROM forfaits
     WHERE actif = 1
       AND (type_utilisateur = ? OR type_utilisateur = 'les_deux')
       AND (prix_mensuel = 0 OR prix_mensuel IS NULL OR LOWER(nom) LIKE '%gratuit%')
     ORDER BY prix_mensuel ASC, id DESC
     LIMIT 1`,
     [role]
  );
  return rows[0] || { id: null, nom: 'Gratuit', max_devis: 10, max_vues_devis: 10, peut_voir_devis: 1, limite_devis_ia: null, max_vues_missions: null, limite_candidature_ia: null, liste_freelancers: 0, liste_employeurs: 0, max_demandes_devis: null, max_devis_recus: null, max_candidatures_recues: null };
};

const getEffectiveForfait = async userId => {
  const [users] = await db.query(
    `SELECT u.id, u.role, u.forfait_id, u.forfait_date_expiration, u.forfait_statut,
            f.nom as forfait_nom, f.max_devis, f.peut_voir_devis, f.actif as forfait_actif,
            f.limite_devis_ia, f.max_vues_missions, f.max_vues_devis, f.limite_candidature_ia,
            f.liste_freelancers, f.liste_employeurs, f.max_demandes_devis, f.max_devis_recus, f.max_candidatures_recues
     FROM users u
     LEFT JOIN forfaits f ON f.id = u.forfait_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );

  const user = users[0];
  if (!user) return null;
  // Ensure it's for freelancer or employer
  if (user.role !== 'freelancer' && user.role !== 'employer') return null;

  if (!user.forfait_id || !user.forfait_actif || isExpired(user)) {
    const free = await getFallbackFreeForfait(user.role);
    return {
      id: free.id,
      nom: free.nom || 'Gratuit',
      max_devis: normalizeLimit(free.max_devis),
      limite_devis_ia: normalizeLimit(free.limite_devis_ia),
      max_vues_missions: normalizeLimit(free.max_vues_missions),
      max_vues_devis: normalizeLimit(free.max_vues_devis),
      limite_candidature_ia: normalizeLimit(free.limite_candidature_ia),
      peut_voir_devis: Number(free.peut_voir_devis ?? 1),
      liste_freelancers: Number(free.liste_freelancers ?? 0),
      liste_employeurs: Number(free.liste_employeurs ?? 0),
      max_demandes_devis: normalizeLimit(free.max_demandes_devis),
      max_devis_recus: normalizeLimit(free.max_devis_recus),
      max_candidatures_recues: normalizeLimit(free.max_candidatures_recues),
      fallback: true
    };
  }

  return {
    id: user.forfait_id,
    nom: user.forfait_nom || 'Forfait actuel',
    max_devis: normalizeLimit(user.max_devis),
    limite_devis_ia: normalizeLimit(user.limite_devis_ia),
    max_vues_missions: normalizeLimit(user.max_vues_missions),
    max_vues_devis: normalizeLimit(user.max_vues_devis),
    limite_candidature_ia: normalizeLimit(user.limite_candidature_ia),
    peut_voir_devis: Number(user.peut_voir_devis ?? 1),
    liste_freelancers: Number(user.liste_freelancers ?? 0),
    liste_employeurs: Number(user.liste_employeurs ?? 0),
    max_demandes_devis: normalizeLimit(user.max_demandes_devis),
    max_devis_recus: normalizeLimit(user.max_devis_recus),
    max_candidatures_recues: normalizeLimit(user.max_candidatures_recues),
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
       AND COALESCE(source, 'detail') IN ('detail', 'freelancer_detail', 'public_detail')
       AND viewed_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`,
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

  const limit = normalizeLimit(forfait?.max_vues_devis);
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
  getEffectiveForfait,
  getMonthlyAiCounter,
  resetMonthlyAiCounterIfNeeded
};
