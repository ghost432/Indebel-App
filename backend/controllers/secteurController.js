const db = require('../config/database');

// Récupérer tous les secteurs avec leurs compétences
exports.getAllSecteursWithCompetences = async (req, res, next) => {
  try {
    const [secteurs] = await db.query(`
      SELECT * FROM secteurs_activite 
      WHERE actif = 1 
      ORDER BY ordre, nom
    `);

    for (let secteur of secteurs) {
      const [competences] = await db.query(`
        SELECT * FROM competences 
        WHERE secteur_id = ? AND actif = 1 
        ORDER BY ordre, nom
      `, [secteur.id]);
      
      secteur.competences = competences;
    }

    res.json({ success: true, data: secteurs });
  } catch (error) {
    next(error);
  }
};

// Récupérer tous les secteurs (admin)
exports.getAllSecteurs = async (req, res, next) => {
  try {
    const [secteurs] = await db.query(`
      SELECT * FROM secteurs_activite 
      ORDER BY ordre, nom
    `);

    res.json({ success: true, data: secteurs });
  } catch (error) {
    next(error);
  }
};

// Créer un secteur
exports.createSecteur = async (req, res, next) => {
  try {
    const { nom, description, ordre } = req.body;

    const [result] = await db.query(
      'INSERT INTO secteurs_activite (nom, description, ordre) VALUES (?, ?, ?)',
      [nom, description || null, ordre || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Secteur créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// Modifier un secteur
exports.updateSecteur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, description, actif, ordre } = req.body;

    await db.query(
      'UPDATE secteurs_activite SET nom = ?, description = ?, actif = ?, ordre = ? WHERE id = ?',
      [nom, description, actif, ordre, id]
    );

    res.json({ success: true, message: 'Secteur mis à jour' });
  } catch (error) {
    next(error);
  }
};

// Supprimer un secteur
exports.deleteSecteur = async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM secteurs_activite WHERE id = ?', [id]);

    res.json({ success: true, message: 'Secteur supprimé' });
  } catch (error) {
    next(error);
  }
};

// Récupérer les compétences d'un secteur
exports.getCompetencesBySecteur = async (req, res, next) => {
  try {
    const { secteurId } = req.params;

    const [competences] = await db.query(`
      SELECT * FROM competences 
      WHERE secteur_id = ? 
      ORDER BY ordre, nom
    `, [secteurId]);

    res.json({ success: true, data: competences });
  } catch (error) {
    next(error);
  }
};

// Créer une compétence
exports.createCompetence = async (req, res, next) => {
  try {
    const { secteur_id, nom, ordre } = req.body;

    const [result] = await db.query(
      'INSERT INTO competences (secteur_id, nom, ordre) VALUES (?, ?, ?)',
      [secteur_id, nom, ordre || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Compétence créée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une compétence
exports.updateCompetence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, actif, ordre } = req.body;

    await db.query(
      'UPDATE competences SET nom = ?, actif = ?, ordre = ? WHERE id = ?',
      [nom, actif, ordre, id]
    );

    res.json({ success: true, message: 'Compétence mise à jour' });
  } catch (error) {
    next(error);
  }
};

// Supprimer une compétence
exports.deleteCompetence = async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM competences WHERE id = ?', [id]);

    res.json({ success: true, message: 'Compétence supprimée' });
  } catch (error) {
    next(error);
  }
};
