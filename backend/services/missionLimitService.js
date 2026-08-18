const db = require('../config/database');
const { getEffectiveForfait } = require('./devisViewLimitService'); // Reuse getEffectiveForfait to fetch limit fields

// 1. Mission View Limits
const getMissionViewedStats = async (userId, missionId, missionType) => {
  const [rows] = await db.query(
    `SELECT
       COUNT(DISTINCT mission_id) as viewed_count,
       MAX(CASE WHEN mission_id = ? AND mission_type = ? THEN 1 ELSE 0 END) as already_viewed_current
     FROM mission_page_views
     WHERE user_id = ?
       AND viewed_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')`,
    [missionId, missionType, userId]
  );

  return {
    viewedCount: Number(rows[0]?.viewed_count || 0),
    alreadyViewedCurrent: Number(rows[0]?.already_viewed_current || 0) === 1
  };
};

const checkMissionViewAccess = async (req, missionId, missionType) => {
  const user = req.user;
  if (!user || user.role !== 'freelancer') {
    return { allowed: true, limited: false };
  }

  const forfait = await getEffectiveForfait(user.id);
  
  // Need to get max_vues_missions since getEffectiveForfait might not select it if we didn't update devisViewLimitService
  // Let's manually fetch max_vues_missions for safety
  const [forfaits] = await db.query('SELECT max_vues_missions, limite_candidature_ia FROM forfaits WHERE id = ?', [forfait.id]);
  const currentForfait = forfaits[0] || {};
  const limit = currentForfait.max_vues_missions;

  const stats = await getMissionViewedStats(user.id, missionId, missionType);

  if (limit === null || limit === undefined) {
    return { allowed: true, limited: false, forfait, limit: null, ...stats };
  }

  if (stats.alreadyViewedCurrent || stats.viewedCount < limit) {
    return { allowed: true, limited: true, forfait, limit, ...stats };
  }

  return {
    allowed: false,
    limited: true,
    code: 'MISSION_VIEW_LIMIT_REACHED',
    status: 403,
    forfait,
    limit,
    ...stats,
    message: `Vous ne pouvez plus voir les détails de missions avec votre forfait ${forfait?.nom || ''}. Veuillez l'améliorer pour en voir plus.`
  };
};

const logMissionView = async (userId, missionId, missionType, source = 'detail') => {
  if (!userId) return;
  try {
    await db.query(
      `INSERT INTO mission_page_views (user_id, mission_id, mission_type, source) VALUES (?, ?, ?, ?)`,
      [userId, missionId, missionType, source]
    );
  } catch (error) {
    console.error('Erreur lors du log de la vue mission:', error);
  }
};

// 2. AI Candidature Limits
let ensureAiCandCounterPromise = null;
const ensureAiCandCounterResetColumn = async () => {
  if (!ensureAiCandCounterPromise) {
    ensureAiCandCounterPromise = (async () => {
      const [columns] = await db.query(
        `SELECT COUNT(*) as count
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = 'compteur_candidature_ia_reset_at'`
      );

      if (Number(columns[0]?.count || 0) === 0) {
        await db.query('ALTER TABLE users ADD COLUMN compteur_candidature_ia_reset_at DATE NULL DEFAULT NULL, ADD COLUMN compteur_candidature_ia INT DEFAULT 0');
      }
    })().catch(error => {
      ensureAiCandCounterPromise = null;
      throw error;
    });
  }
  return ensureAiCandCounterPromise;
};

const resetMonthlyAiCandidatureCounterIfNeeded = async userId => {
  await ensureAiCandCounterResetColumn();
  await db.query(
    `UPDATE users
     SET compteur_candidature_ia = 0,
         compteur_candidature_ia_reset_at = CURRENT_DATE
     WHERE id = ?
       AND (
         compteur_candidature_ia_reset_at IS NULL
         OR compteur_candidature_ia_reset_at < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
       )`,
    [userId]
  );
};

const getMonthlyAiCandidatureCounter = async userId => {
  await resetMonthlyAiCandidatureCounterIfNeeded(userId);
  const [rows] = await db.query('SELECT compteur_candidature_ia FROM users WHERE id = ?', [userId]);
  return Number(rows[0]?.compteur_candidature_ia || 0);
};

const incrementAiCandidatureCounter = async userId => {
  await db.query('UPDATE users SET compteur_candidature_ia = compteur_candidature_ia + 1 WHERE id = ?', [userId]);
};

const checkAiCandidatureAccess = async (req) => {
  const user = req.user;
  if (!user || user.role !== 'freelancer') {
    return { allowed: true, limited: false };
  }

  const forfait = await getEffectiveForfait(user.id);
  const [forfaits] = await db.query('SELECT limite_candidature_ia FROM forfaits WHERE id = ?', [forfait.id]);
  const limit = forfaits[0]?.limite_candidature_ia;

  const currentCount = await getMonthlyAiCandidatureCounter(user.id);

  if (limit === null || limit === undefined) {
    return { allowed: true, limited: false, forfait, limit: null, currentCount };
  }

  if (currentCount < limit) {
    return { allowed: true, limited: true, forfait, limit, currentCount };
  }

  return {
    allowed: false,
    limited: true,
    code: 'AI_CANDIDATURE_LIMIT_REACHED',
    status: 403,
    forfait,
    limit,
    currentCount,
    message: `Vous avez atteint la limite de ${limit} candidatures générées par l'IA de votre forfait ${forfait?.nom || ''}.`
  };
};

module.exports = {
  checkMissionViewAccess,
  logMissionView,
  checkAiCandidatureAccess,
  incrementAiCandidatureCounter,
  getMonthlyAiCandidatureCounter
};
