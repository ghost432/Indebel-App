const pool = require('../config/database');

const profileViewController = {
  // Enregistrer une vue de profil
  trackProfileView: async (req, res) => {
    try {
      const { viewedUserId } = req.body;
      const viewerId = req.user?.id || null;
      const viewerType = req.user ? 'authenticated' : 'anonymous';
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const referrer = req.headers['referer'] || req.headers['referrer'];

      // Éviter de compter les vues de son propre profil
      if (viewerId && viewerId === parseInt(viewedUserId)) {
        return res.status(200).json({
          success: true,
          message: 'Vue du propre profil ignorée'
        });
      }

      // Vérifier si une vue récente existe (dernière heure)
      const [recentView] = await pool.query(
        `SELECT id FROM profile_views 
         WHERE viewed_user_id = ? 
         AND (viewer_id = ? OR (viewer_id IS NULL AND ip_address = ?))
         AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
         LIMIT 1`,
        [viewedUserId, viewerId, ipAddress]
      );

      // Si une vue récente existe, ne pas créer de doublon
      if (recentView.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Vue déjà enregistrée récemment'
        });
      }

      // Enregistrer la vue
      await pool.query(
        `INSERT INTO profile_views (viewer_id, viewed_user_id, viewer_type, ip_address, user_agent, referrer)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [viewerId, viewedUserId, viewerType, ipAddress, userAgent, referrer]
      );

      res.status(201).json({
        success: true,
        message: 'Vue de profil enregistrée'
      });
    } catch (error) {
      console.error('Erreur enregistrement vue:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // Obtenir les statistiques de vues pour un utilisateur
  getProfileViewStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const { period = '30' } = req.query; // Par défaut 30 jours

      // Total des vues
      const [totalViews] = await pool.query(
        `SELECT COUNT(*) as total FROM profile_views WHERE viewed_user_id = ?`,
        [userId]
      );

      // Vues sur la période
      const [periodViews] = await pool.query(
        `SELECT COUNT(*) as total FROM profile_views 
         WHERE viewed_user_id = ? 
         AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, parseInt(period)]
      );

      // Vues par jour sur la période (pour le graphe)
      const [dailyViews] = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as views
         FROM profile_views
         WHERE viewed_user_id = ?
         AND created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [userId, parseInt(period)]
      );

      // Derniers visiteurs authentifiés
      const [recentViewers] = await pool.query(
        `SELECT DISTINCT
          u.id,
          u.prenom,
          u.nom,
          u.denomination,
          u.role,
          pv.created_at
         FROM profile_views pv
         JOIN users u ON pv.viewer_id = u.id
         WHERE pv.viewed_user_id = ?
         AND pv.viewer_id IS NOT NULL
         ORDER BY pv.created_at DESC
         LIMIT 5`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          totalViews: totalViews[0].total,
          periodViews: periodViews[0].total,
          dailyViews: dailyViews,
          recentViewers: recentViewers.map(viewer => ({
            id: viewer.id,
            name: viewer.role === 'employer' 
              ? viewer.denomination 
              : `${viewer.prenom} ${viewer.nom}`,
            type: viewer.role,
            viewedAt: viewer.created_at
          }))
        }
      });
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  },

  // Obtenir les vues détaillées
  getDetailedViews: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const [views] = await pool.query(
        `SELECT 
          pv.id,
          pv.viewer_type,
          pv.created_at,
          u.id as viewer_id,
          u.prenom,
          u.nom,
          u.denomination,
          u.role
         FROM profile_views pv
         LEFT JOIN users u ON pv.viewer_id = u.id
         WHERE pv.viewed_user_id = ?
         ORDER BY pv.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, parseInt(limit), parseInt(offset)]
      );

      const [totalCount] = await pool.query(
        `SELECT COUNT(*) as total FROM profile_views WHERE viewed_user_id = ?`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          views: views.map(view => ({
            id: view.id,
            viewerType: view.viewer_type,
            viewerName: view.viewer_id 
              ? (view.role === 'employer' ? view.denomination : `${view.prenom} ${view.nom}`)
              : 'Visiteur anonyme',
            viewedAt: view.created_at
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount[0].total,
            pages: Math.ceil(totalCount[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur récupération vues détaillées:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
};

module.exports = profileViewController;
