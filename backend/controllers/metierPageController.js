const db = require('../config/database');

exports.getPublicPage = async (req, res, next) => {
  try {
    const [pages] = await db.query(
      `SELECT slug, nom, titre, introduction
       FROM metier_pages
       WHERE slug = ? AND actif = 1
       LIMIT 1`,
      [req.params.slug]
    );

    if (!pages.length) return res.status(404).json({ success: false, message: 'Métier introuvable' });

    res.json({ success: true, data: pages[0] });
  } catch (error) {
    next(error);
  }
};

exports.getAllPages = async (req, res, next) => {
  try {
    const [pages] = await db.query(
      'SELECT id, slug, nom, titre, introduction, actif, updated_at FROM metier_pages ORDER BY nom'
    );

    res.json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
};

exports.updatePage = async (req, res, next) => {
  try {
    const { titre, introduction, actif } = req.body;
    const [result] = await db.query(
      'UPDATE metier_pages SET titre = ?, introduction = ?, actif = ? WHERE id = ?',
      [titre, introduction, actif ? 1 : 0, req.params.id]
    );

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Métier introuvable' });

    res.json({ success: true, message: 'Contenu métier mis à jour' });
  } catch (error) {
    next(error);
  }
};
