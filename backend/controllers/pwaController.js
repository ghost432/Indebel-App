const db = require('../config/database');

/**
 * Enregistrer une installation PWA
 */
exports.enregistrerInstallation = async (req, res) => {
  try {
    const { deviceType, os, browser, userAgent } = req.body;
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip || req.connection.remoteAddress;

    await db.query(
      `INSERT INTO pwa_installations 
       (user_id, device_type, os, browser, user_agent, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, deviceType, os, browser, userAgent, ipAddress]
    );

    res.json({ success: true, message: 'Installation enregistrée' });
  } catch (error) {
    console.error('Erreur enregistrerInstallation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Obtenir les statistiques des installations PWA (Admin)
 */
exports.getStatistiques = async (req, res) => {
  try {
    // Total installations
    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM pwa_installations WHERE is_active = TRUE'
    );

    // Par type d'appareil
    const [parDevice] = await db.query(
      `SELECT device_type, COUNT(*) as count 
       FROM pwa_installations 
       WHERE is_active = TRUE 
       GROUP BY device_type`
    );

    // Par système d'exploitation
    const [parOS] = await db.query(
      `SELECT os, COUNT(*) as count 
       FROM pwa_installations 
       WHERE is_active = TRUE AND os IS NOT NULL 
       GROUP BY os 
       ORDER BY count DESC 
       LIMIT 10`
    );

    // Par navigateur
    const [parBrowser] = await db.query(
      `SELECT browser, COUNT(*) as count 
       FROM pwa_installations 
       WHERE is_active = TRUE AND browser IS NOT NULL 
       GROUP BY browser 
       ORDER BY count DESC 
       LIMIT 10`
    );

    // Installations récentes (7 derniers jours)
    const [recentes] = await db.query(
      `SELECT DATE(installation_date) as date, COUNT(*) as count 
       FROM pwa_installations 
       WHERE installation_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(installation_date) 
       ORDER BY date DESC`
    );

    // Utilisateurs avec PWA
    const [avecUtilisateurs] = await db.query(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM pwa_installations 
       WHERE user_id IS NOT NULL AND is_active = TRUE`
    );

    res.json({
      success: true,
      stats: {
        total: totalResult[0].total,
        parDevice,
        parOS,
        parBrowser,
        recentes,
        avecUtilisateurs: avecUtilisateurs[0].count
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiques:', error);
    res.json({
      success: true,
      stats: {
        total: 0,
        parDevice: [],
        parOS: [],
        parBrowser: [],
        recentes: [],
        avecUtilisateurs: 0
      }
    });
  }
};

/**
 * Obtenir la liste des installations (Admin)
 */
exports.getInstallations = async (req, res) => {
  try {
    const [installations] = await db.query(
      `SELECT 
        i.*,
        u.nom,
        u.prenom,
        u.email
       FROM pwa_installations i
       LEFT JOIN users u ON i.user_id = u.id
       ORDER BY i.installation_date DESC
       LIMIT 100`
    );

    res.json({ success: true, installations });
  } catch (error) {
    console.error('Erreur getInstallations:', error);
    res.json({ success: true, installations: [] });
  }
};

/**
 * Enregistrer un abonnement push
 */
exports.enregistrerPushSubscription = async (req, res) => {
  try {
    const { endpoint, keys, deviceType, userAgent } = req.body;
    const userId = req.user ? req.user.id : null;

    // Vérifier si l'abonnement existe déjà
    const [existing] = await db.query(
      'SELECT id FROM push_subscriptions WHERE endpoint = ?',
      [endpoint]
    );

    if (existing.length > 0) {
      // Mettre à jour
      await db.query(
        `UPDATE push_subscriptions 
         SET user_id = ?, is_active = TRUE, last_used = NOW() 
         WHERE endpoint = ?`,
        [userId, endpoint]
      );
    } else {
      // Créer nouveau
      await db.query(
        `INSERT INTO push_subscriptions 
         (user_id, endpoint, p256dh_key, auth_key, device_type, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, endpoint, keys.p256dh, keys.auth, deviceType, userAgent]
      );
    }

    res.json({ success: true, message: 'Abonnement enregistré' });
  } catch (error) {
    console.error('Erreur enregistrerPushSubscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Obtenir les statistiques des notifications push (Admin)
 */
exports.getPushStats = async (req, res) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT user_id) as utilisateurs_uniques,
        SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) as mobile,
        SUM(CASE WHEN device_type = 'tablet' THEN 1 ELSE 0 END) as tablet,
        SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END) as desktop
       FROM push_subscriptions 
       WHERE is_active = TRUE`
    );

    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    console.error('Erreur getPushStats:', error);
    // Retourner des valeurs par défaut si la table n'existe pas
    res.json({ 
      success: true, 
      stats: { 
        total: 0, 
        utilisateurs_uniques: 0, 
        mobile: 0, 
        tablet: 0, 
        desktop: 0 
      } 
    });
  }
};
