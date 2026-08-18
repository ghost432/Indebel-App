const db = require('../config/database');

exports.getExtraStats = async (req, res, next) => {
  try {
    let whereClause = '';
    let params = [];
    if (req.user && req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      whereClause = 'WHERE freelancer_id IN (SELECT id FROM users WHERE created_by = ?) OR employer_id IN (SELECT id FROM users WHERE created_by = ?)';
      params = [req.user.id, req.user.id];
    }

    // 1. Stats des devis (demandes_devis)
    const [devisStats] = await db.query(`
      SELECT 
        COUNT(*) as total_devis,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as devis_en_attente,
        SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as devis_valides,
        SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as devis_refuses
      FROM demandes_devis
      ${whereClause}
    `, params);

    // 2. Stats des devis par ville
    const [devisByCity] = await db.query(`
      SELECT 
        CASE 
          WHEN ville LIKE '%Bruxelles%' OR ville LIKE '%Brussels%' THEN 'Bruxelles'
          WHEN ville LIKE '%Anvers%' OR ville LIKE '%Antwerpen%' THEN 'Anvers'
          WHEN ville LIKE '%Gand%' OR ville LIKE '%Gent%' THEN 'Gand'
          WHEN ville LIKE '%Charleroi%' THEN 'Charleroi'
          WHEN ville LIKE '%Liège%' THEN 'Liège'
          WHEN ville LIKE '%Bruges%' OR ville LIKE '%Brugge%' THEN 'Bruges'
          WHEN ville LIKE '%Namur%' OR ville LIKE '%Namen%' THEN 'Namur'
          WHEN ville LIKE '%Louvain%' OR ville LIKE '%Leuven%' THEN 'Louvain'
          WHEN ville LIKE '%Mons%' OR ville LIKE '%Bergen%' THEN 'Mons'
          WHEN ville LIKE '%Tournai%' THEN 'Tournai'
          ELSE 'Autres'
        END as ville,
        COUNT(*) as total
      FROM demandes_devis
      ${whereClause}
      GROUP BY 
        CASE 
          WHEN ville LIKE '%Bruxelles%' OR ville LIKE '%Brussels%' THEN 'Bruxelles'
          WHEN ville LIKE '%Anvers%' OR ville LIKE '%Antwerpen%' THEN 'Anvers'
          WHEN ville LIKE '%Gand%' OR ville LIKE '%Gent%' THEN 'Gand'
          WHEN ville LIKE '%Charleroi%' THEN 'Charleroi'
          WHEN ville LIKE '%Liège%' THEN 'Liège'
          WHEN ville LIKE '%Bruges%' OR ville LIKE '%Brugge%' THEN 'Bruges'
          WHEN ville LIKE '%Namur%' OR ville LIKE '%Namen%' THEN 'Namur'
          WHEN ville LIKE '%Louvain%' OR ville LIKE '%Leuven%' THEN 'Louvain'
          WHEN ville LIKE '%Mons%' OR ville LIKE '%Bergen%' THEN 'Mons'
          WHEN ville LIKE '%Tournai%' THEN 'Tournai'
          ELSE 'Autres'
        END
      ORDER BY total DESC
    `, params);

    // 3. Top 10 Pages les plus vues
    let topPages = [];
    try {
      const [pages] = await db.query(`
        SELECT url as page, COUNT(*) as vues
        FROM page_visits
        GROUP BY url
        ORDER BY vues DESC
        LIMIT 10
      `);
      topPages = pages;
    } catch (e) {
      console.error("Table page_visits n'existe pas ou erreur", e);
    }

    res.json({
      success: true,
      data: {
        devis: devisStats[0] || { total_devis: 0, devis_en_attente: 0, devis_valides: 0, devis_refuses: 0 },
        devisByCity: devisByCity || [],
        topPages: topPages || []
      }
    });
  } catch (error) {
    next(error);
  }
};
