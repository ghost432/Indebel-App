const db = require('../config/database');

// Créer mission forfait horaire
exports.createMissionHourly = async (req, res, next) => {
  try {
    const {
      titre, type_mission, categorie, langues_parlees, description,
      competences, forfait_heure, heures_travail_max, type_facturation,
      adresse_mission, lieu_mission, autre_lieu, date_debut, nombre_independants, urgente
    } = req.body;

    // Si employer_id est fourni (admin), l'utiliser, sinon utiliser l'ID de l'utilisateur connecté
    const employer_id = req.body.employer_id || req.user.id;

    // Vérifier le forfait de l'employeur
    const [employerInfo] = await db.query(
      `SELECT u.forfait_id, u.forfait_date_expiration, f.max_missions, f.nom as forfait_nom
       FROM users u
       LEFT JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ? AND u.role = 'employer'`,
      [employer_id]
    );

    if (employerInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non autorisé à publier des missions'
      });
    }

    const employer = employerInfo[0];

    // Vérifier si le forfait existe et est valide
    if (!employer.forfait_id) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez souscrire à un forfait pour publier des missions',
        code: 'NO_FORFAIT'
      });
    }

    // Vérifier si le forfait est expiré
    if (employer.forfait_date_expiration && new Date(employer.forfait_date_expiration) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Votre forfait a expiré. Veuillez le renouveler pour publier des missions.',
        code: 'FORFAIT_EXPIRED'
      });
    }

    // Vérifier la limite de missions si définie
    if (employer.max_missions !== null) {
      const [[{ count: missionCount }]] = await db.query(
        `SELECT 
          (SELECT COUNT(*) FROM missions_forfait_horaire WHERE employer_id = ? AND statut IN ('ouvert', 'en_cours')) +
          (SELECT COUNT(*) FROM missions_forfait_fixe WHERE employer_id = ? AND statut IN ('ouvert', 'en_cours')) as count`,
        [employer_id, employer_id]
      );

      if (missionCount >= employer.max_missions) {
        return res.status(403).json({
          success: false,
          message: `Vous avez atteint la limite de missions de votre forfait ${employer.forfait_nom} (${employer.max_missions} missions). Mettez à niveau votre forfait pour publier plus de missions.`,
          code: 'MAX_MISSIONS_REACHED',
          data: { currentMissions: missionCount, maxMissions: employer.max_missions }
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO missions_forfait_horaire (
        employer_id, titre, type_mission, categorie, langues_parlees,
        description, competences, forfait_heure, heures_travail_max,
        type_facturation, adresse_mission, lieu_mission, autre_lieu,
        date_debut, nombre_independants, urgente, date_fermeture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`,
      [
        employer_id, titre, type_mission, categorie, JSON.stringify(langues_parlees),
        description, JSON.stringify(competences), forfait_heure, heures_travail_max,
        type_facturation, adresse_mission, lieu_mission, autre_lieu || null,
        date_debut, nombre_independants, urgente || false
      ]
    );

    // Envoyer notifications mission publiée
    try {
      const [employerData] = await db.query(
        'SELECT email, denomination, prenom, nom FROM users WHERE id = ?',
        [employer_id]
      );

      if (employerData.length > 0) {
        const employer = employerData[0];
        const employerName = employer.denomination || `${employer.prenom} ${employer.nom}`;
        const additionalNotif = require('../services/additionalNotifications');

        // NOUVEAU: Notification Admin (Validation requise) + Recruteur (En attente)
        await additionalNotif.notifyMissionCreation(
          { titre, type: 'Forfait Horaire', budget: `${forfait_heure}€/h` },
          employer
        );
      }
    } catch (notifError) {
      console.error('Erreur notification mission publiée:', notifError);
      // Ne pas bloquer la création de mission si notification échoue
    }

    res.status(201).json({
      success: true,
      message: 'Mission créée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// Créer mission forfait fixe
exports.createMissionFixed = async (req, res, next) => {
  try {
    const {
      titre, type_mission, categorie, langues_parlees, description,
      competences, forfait_mission, temps_max_estime, type_facturation,
      adresse_mission, lieu_mission, autre_lieu, date_debut, nombre_independants, urgente
    } = req.body;

    // Si employer_id est fourni (admin), l'utiliser, sinon utiliser l'ID de l'utilisateur connecté
    const employer_id = req.body.employer_id || req.user.id;

    // Vérifier le forfait de l'employeur
    const [employerInfo] = await db.query(
      `SELECT u.forfait_id, u.forfait_date_expiration, f.max_missions, f.nom as forfait_nom
       FROM users u
       LEFT JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ? AND u.role = 'employer'`,
      [employer_id]
    );

    if (employerInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non autorisé à publier des missions'
      });
    }

    const employer = employerInfo[0];

    // Vérifier si le forfait existe et est valide
    if (!employer.forfait_id) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez souscrire à un forfait pour publier des missions',
        code: 'NO_FORFAIT'
      });
    }

    // Vérifier si le forfait est expiré
    if (employer.forfait_date_expiration && new Date(employer.forfait_date_expiration) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Votre forfait a expiré. Veuillez le renouveler pour publier des missions.',
        code: 'FORFAIT_EXPIRED'
      });
    }

    // Vérifier la limite de missions si définie
    if (employer.max_missions !== null) {
      const [[{ count: missionCount }]] = await db.query(
        `SELECT 
          (SELECT COUNT(*) FROM missions_forfait_horaire WHERE employer_id = ? AND statut IN ('ouvert', 'en_cours')) +
          (SELECT COUNT(*) FROM missions_forfait_fixe WHERE employer_id = ? AND statut IN ('ouvert', 'en_cours')) as count`,
        [employer_id, employer_id]
      );

      if (missionCount >= employer.max_missions) {
        return res.status(403).json({
          success: false,
          message: `Vous avez atteint la limite de missions de votre forfait ${employer.forfait_nom} (${employer.max_missions} missions). Mettez à niveau votre forfait pour publier plus de missions.`,
          code: 'MAX_MISSIONS_REACHED',
          data: { currentMissions: missionCount, maxMissions: employer.max_missions }
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO missions_forfait_fixe (
        employer_id, titre, type_mission, categorie, langues_parlees,
        description, competences, forfait_mission, temps_max_estime,
        type_facturation, adresse_mission, lieu_mission, autre_lieu,
        date_debut, nombre_independants, urgente, date_fermeture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`,
      [
        employer_id, titre, type_mission, categorie, JSON.stringify(langues_parlees),
        description, JSON.stringify(competences), forfait_mission, temps_max_estime,
        type_facturation, adresse_mission, lieu_mission, autre_lieu || null,
        date_debut, nombre_independants, urgente || false
      ]
    );

    // Envoyer notifications mission publiée
    try {
      const [employerData] = await db.query(
        'SELECT email, denomination, prenom, nom FROM users WHERE id = ?',
        [employer_id]
      );

      if (employerData.length > 0) {
        const employer = employerData[0];
        const employerName = employer.denomination || `${employer.prenom} ${employer.nom}`;
        const additionalNotif = require('../services/additionalNotifications');

        // NOUVEAU: Notification Admin (Validation requise) + Recruteur (En attente)
        await additionalNotif.notifyMissionCreation(
          { titre, type: 'Forfait Fixe', budget: `${forfait_mission}€` },
          employer
        );
      }
    } catch (notifError) {
      console.error('Erreur notification mission publiée:', notifError);
      // Ne pas bloquer la création de mission si notification échoue
    }

    res.status(201).json({
      success: true,
      message: 'Mission créée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer toutes les missions (pour admin)
exports.getAllMissions = async (req, res, next) => {
  try {
    let whereClause = '';
    let params = [];
    if (req.user && req.user.email !== 'noreply@indebel.be' && req.user.role === 'admin') {
      whereClause = 'WHERE u.created_by = ? OR u.id = ?';
      params = [req.user.id, req.user.id];
    }

    const [hourly] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'hourly' as mission_type
      FROM missions_forfait_horaire m
      LEFT JOIN users u ON m.employer_id = u.id
      ${whereClause}
      ORDER BY m.date_creation DESC
    `, params);

    const [fixed] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'fixed' as mission_type
      FROM missions_forfait_fixe m
      LEFT JOIN users u ON m.employer_id = u.id
      ${whereClause}
      ORDER BY m.date_creation DESC
    `, params);

    const [freelancerJobs] = await db.query(`
      SELECT j.id, j.titre, j.description, j.secteur as categorie,
             j.type_mission, j.competences_requises as competences, 
             j.taux_horaire as forfait_heure,
             j.budget_fixe as budget_projet, j.heures_estimees as heures_travail_max,
             j.type_facturation, j.localisation as adresse_mission, j.ville_mission,
             j.lieu_mission, j.autre_lieu, j.date_debut, j.nombre_independants,
             j.urgente, j.date_creation, j.type_forfait as mission_type,
             u.denomination, u.nom, u.prenom, 'jobs_freelancer' as table_source,
             1 as is_freelancer_job, j.statut
      FROM jobs_freelancer j
      LEFT JOIN users u ON j.freelancer_id = u.id
      ${whereClause}
      ORDER BY j.date_creation DESC
    `, params);

    const missions = [...hourly, ...fixed, ...freelancerJobs].sort((a, b) =>
      new Date(b.date_creation) - new Date(a.date_creation)
    );

    res.json({ success: true, data: missions });
  } catch (error) {
    next(error);
  }
};

// Récupérer les missions d'un employer spécifique
exports.getEmployerMissions = async (req, res, next) => {
  try {
    const employer_id = req.user.id;

    const [hourly] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'hourly' as mission_type, 'missions_forfait_horaire' as table_source
      FROM missions_forfait_horaire m
      LEFT JOIN users u ON m.employer_id = u.id
      WHERE m.employer_id = ?
      ORDER BY m.date_creation DESC
    `, [employer_id]);

    const [fixed] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'fixed' as mission_type, 'missions_forfait_fixe' as table_source
      FROM missions_forfait_fixe m
      LEFT JOIN users u ON m.employer_id = u.id
      WHERE m.employer_id = ?
      ORDER BY m.date_creation DESC
    `, [employer_id]);

    const [freelancerJobs] = await db.query(`
      SELECT j.id, j.titre, j.description, j.secteur as categorie,
             j.type_mission, j.competences_requises as competences, 
             j.taux_horaire as forfait_heure,
             j.budget_fixe as budget_projet, j.heures_estimees as heures_travail_max,
             j.type_facturation, j.localisation as adresse_mission, j.ville_mission,
             j.lieu_mission, j.autre_lieu, j.date_debut, j.nombre_independants,
             j.urgente, j.date_creation, j.type_forfait as mission_type,
             u.denomination, u.nom, u.prenom, 'jobs_freelancer' as table_source,
             1 as is_freelancer_job
      FROM jobs_freelancer j
      LEFT JOIN users u ON j.freelancer_id = u.id
      WHERE j.freelancer_id = ?
      ORDER BY j.date_creation DESC
    `, [employer_id]);

    const missions = [...hourly, ...fixed, ...freelancerJobs].sort((a, b) =>
      new Date(b.date_creation) - new Date(a.date_creation)
    );

    res.json({ success: true, data: missions });
  } catch (error) {
    next(error);
  }
};

// Stats missions
exports.getMissionStats = async (req, res, next) => {
  try {
    let whereClause = '';
    let params = [];
    if (req.user && req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      whereClause = 'WHERE employer_id IN (SELECT id FROM users WHERE created_by = ?) OR employer_id = ?';
      params = [req.user.id, req.user.id];
    }

    const [hourlyStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN statut = 'ouvert' THEN 1 ELSE 0 END), 0) as ouverts,
        COALESCE(SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END), 0) as en_cours,
        COALESCE(SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END), 0) as terminees
      FROM missions_forfait_horaire
      ${whereClause}
    `, params);

    const [fixedStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN statut = 'ouvert' THEN 1 ELSE 0 END), 0) as ouverts,
        COALESCE(SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END), 0) as en_cours,
        COALESCE(SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END), 0) as terminees
      FROM missions_forfait_fixe
      ${whereClause}
    `, params);

    let freeWhereClause = whereClause.replace(/employer_id/g, 'freelancer_id');
    const [freelancerStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN statut = 'ouvert' THEN 1 ELSE 0 END), 0) as ouverts,
        COALESCE(SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END), 0) as en_cours,
        COALESCE(SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END), 0) as terminees
      FROM jobs_freelancer
      ${freeWhereClause}
    `, params);

    res.json({
      success: true,
      data: {
        total: Number(hourlyStats[0]?.total || 0) + Number(fixedStats[0]?.total || 0) + Number(freelancerStats[0]?.total || 0),
        ouverts: Number(hourlyStats[0]?.ouverts || 0) + Number(fixedStats[0]?.ouverts || 0) + Number(freelancerStats[0]?.ouverts || 0),
        en_cours: Number(hourlyStats[0]?.en_cours || 0) + Number(fixedStats[0]?.en_cours || 0) + Number(freelancerStats[0]?.en_cours || 0),
        terminees: Number(hourlyStats[0]?.terminees || 0) + Number(fixedStats[0]?.terminees || 0) + Number(freelancerStats[0]?.terminees || 0),
        hourly: hourlyStats[0],
        fixed: fixedStats[0],
        freelancer: freelancerStats[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Ignorer une mission
exports.ignorerMission = async (req, res, next) => {
  try {
    const freelancer_id = req.user.id;
    const { mission_id, mission_type } = req.body;

    // Vérifier si déjà ignorée
    const [existing] = await db.query(
      'SELECT id FROM missions_ignorees WHERE freelancer_id = ? AND mission_id = ? AND mission_type = ?',
      [freelancer_id, mission_id, mission_type]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Mission déjà ignorée'
      });
    }

    // Ajouter à la liste des missions ignorées
    await db.query(
      'INSERT INTO missions_ignorees (freelancer_id, mission_id, mission_type) VALUES (?, ?, ?)',
      [freelancer_id, mission_id, mission_type]
    );

    res.json({
      success: true,
      message: 'Mission ignorée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les missions publiques (sans auth)
exports.getMissionsPubliques = async (req, res, next) => {
  try {
    const [hourly] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'hourly' as mission_type
      FROM missions_forfait_horaire m
      LEFT JOIN users u ON m.employer_id = u.id
      WHERE m.statut = 'ouvert'
      ORDER BY m.date_creation DESC LIMIT 50
    `);

    const [fixed] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'fixed' as mission_type
      FROM missions_forfait_fixe m
      LEFT JOIN users u ON m.employer_id = u.id
      WHERE m.statut = 'ouvert'
      ORDER BY m.date_creation DESC LIMIT 50
    `);

    const [freelancerJobs] = await db.query(`
      SELECT j.id, j.titre, j.description, j.secteur as categorie,
             j.type_mission, j.competences_requises as competences, 
             j.taux_horaire as forfait_heure,
             j.budget_fixe as budget_projet, j.heures_estimees as heures_travail_max,
             j.type_facturation, j.localisation as adresse_mission, j.ville_mission,
             j.lieu_mission, j.autre_lieu, j.date_debut, j.nombre_independants,
             j.urgente, j.date_creation, j.type_forfait as mission_type,
             u.denomination, u.nom, u.prenom, 'freelancer' as source
      FROM jobs_freelancer j
      LEFT JOIN users u ON j.freelancer_id = u.id
      WHERE j.statut = 'ouvert'
      ORDER BY j.date_creation DESC LIMIT 50
    `);

    const missions = [...hourly, ...fixed, ...freelancerJobs].sort((a, b) =>
      new Date(b.date_creation) - new Date(a.date_creation)
    );

    res.json({ success: true, data: missions });
  } catch (error) {
    next(error);
  }
};

// Récupérer le détail public d'une mission (sans auth)
exports.getMissionPubliqueById = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const { source } = req.query;

    if (!['hourly', 'fixed'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de mission invalide'
      });
    }

    const standardTable = type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
    let missions = [];

    if (source !== 'freelancer') {
      const [rows] = await db.query(
        `SELECT m.*, u.denomination, u.nom, u.prenom, ? as mission_type, 'employer' as source
         FROM ${standardTable} m
         LEFT JOIN users u ON m.employer_id = u.id
         WHERE m.id = ? AND m.statut = 'ouvert'
         LIMIT 1`,
        [type, id]
      );
      missions = rows;
    }

    if (missions.length === 0) {
      const [rows] = await db.query(
        `SELECT j.id, j.titre, j.description, j.secteur as categorie,
                j.type_mission, j.competences_requises as competences,
                j.taux_horaire as forfait_heure,
                j.budget_fixe as forfait_mission,
                j.heures_estimees as heures_travail_max,
                j.type_facturation, j.localisation as adresse_mission, j.ville_mission,
                j.lieu_mission, j.autre_lieu, j.date_debut, j.nombre_independants,
                j.urgente, j.date_creation, j.type_forfait as mission_type,
                u.denomination, u.nom, u.prenom, 'freelancer' as source
         FROM jobs_freelancer j
         LEFT JOIN users u ON j.freelancer_id = u.id
         WHERE j.id = ? AND j.type_forfait = ? AND j.statut = 'ouvert'
         LIMIT 1`,
        [id, type]
      );
      missions = rows;
    }

    if (missions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée ou non disponible'
      });
    }

    res.json({ success: true, data: missions[0] });
  } catch (error) {
    next(error);
  }
};

// Récupérer les missions disponibles pour un freelancer (exclure les ignorées et filtrer par ville)
exports.getMissionsDisponibles = async (req, res, next) => {
  try {
    const freelancer_id = req.user.id;

    // Récupérer la ville du freelancer depuis son adresse
    const [freelancer] = await db.query(
      'SELECT adresse FROM users WHERE id = ?',
      [freelancer_id]
    );

    let freelancerCity = null;
    if (freelancer[0] && freelancer[0].adresse) {
      // Extraire la ville depuis l'adresse
      // Format belge attendu : "Rue Numéro, Code postal Ville"
      const addressParts = freelancer[0].adresse.split(',').map(part => part.trim());

      if (addressParts.length >= 2) {
        const secondPart = addressParts[1];
        const words = secondPart.split(' ').filter(w => w.length > 0);
        if (words.length > 1) {
          freelancerCity = words.slice(1).join(' ');
        } else if (words.length === 1) {
          freelancerCity = words[0];
        }
      }
    }

    // Requête de base pour les missions
    let whereClauses = 'm.statut = ? AND mi.id IS NULL';
    let params = ['ouvert'];

    if (freelancerCity) {
      whereClauses += ' AND m.ville_mission = ?';
      params.push(freelancerCity);
    }

    // Récupérer les missions taux horaire
    const [hourly] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'hourly' as mission_type
      FROM missions_forfait_horaire m
      LEFT JOIN users u ON m.employer_id = u.id
      LEFT JOIN missions_ignorees mi ON mi.mission_id = m.id 
        AND mi.mission_type = 'hourly' 
        AND mi.freelancer_id = ?
      WHERE ${whereClauses}
      ORDER BY m.date_creation DESC
    `, [freelancer_id, ...params]);

    // Récupérer les missions fixes
    const [fixed] = await db.query(`
      SELECT m.*, u.denomination, u.nom, u.prenom, 'fixed' as mission_type
      FROM missions_forfait_fixe m
      LEFT JOIN users u ON m.employer_id = u.id
      LEFT JOIN missions_ignorees mi ON mi.mission_id = m.id 
        AND mi.mission_type = 'fixed' 
        AND mi.freelancer_id = ?
      WHERE ${whereClauses}
      ORDER BY m.date_creation DESC
    `, [freelancer_id, ...params]);

    // Récupérer les missions de prestataires
    let fWhereClauses = 'j.statut = ? AND mi.id IS NULL';
    let fParams = ['ouvert'];
    if (freelancerCity) {
      fWhereClauses += ' AND j.ville_mission = ?';
      fParams.push(freelancerCity);
    }

    const [freelancerJobs] = await db.query(`
      SELECT j.id, j.titre, j.description, j.secteur as categorie,
             j.type_mission, j.competences_requises as competences, 
             j.taux_horaire as forfait_heure,
             j.budget_fixe as budget_projet, j.heures_estimees as heures_travail_max,
             j.type_facturation, j.localisation as localisation, j.ville_mission,
             j.lieu_mission, j.autre_lieu, j.date_debut, j.nombre_independants,
             j.urgente, j.date_creation, j.type_forfait as mission_type,
             u.denomination, u.nom, u.prenom, 'freelancer' as source
      FROM jobs_freelancer j
      LEFT JOIN users u ON j.freelancer_id = u.id
      LEFT JOIN missions_ignorees mi ON mi.mission_id = j.id 
        AND mi.mission_type = j.type_forfait
        AND mi.freelancer_id = ?
      WHERE ${fWhereClauses}
      ORDER BY j.date_creation DESC
    `, [freelancer_id, ...fParams]);

    const missions = [...hourly, ...fixed, ...freelancerJobs].sort((a, b) =>
      new Date(b.date_creation) - new Date(a.date_creation)
    );

    res.json({
      success: true,
      data: missions,
      filtered_by_city: freelancerCity || null
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour le statut d'une mission (Admin)
exports.updateMissionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut, type } = req.body; // type: 'hourly' ou 'fixed'

    if (!['en_attente', 'ouvert', 'ferme', 'refuse', 'en_cours', 'termine'].includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    if (!type || (type !== 'hourly' && type !== 'fixed')) {
      return res.status(400).json({
        success: false,
        message: 'Type de mission requis (hourly ou fixed)'
      });
    }

    const table = type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';

    // Vérifier si la mission existe
    const [mission] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);

    if (mission.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    // Mettre à jour le statut
    await db.query(`UPDATE ${table} SET statut = ? WHERE id = ?`, [statut, id]);

    // Notifier le recruteur du changement de statut
    try {
      const [missionData] = await db.query(
        `SELECT m.titre, u.id as employer_id, u.email, u.prenom, u.denomination 
         FROM ${table} m 
         JOIN users u ON m.employer_id = u.id 
         WHERE m.id = ?`,
        [id]
      );

      if (missionData.length > 0) {
        const mission = missionData[0];
        const additionalNotif = require('../services/additionalNotifications');

        await additionalNotif.notifyMissionStatusChange(
          { titre: mission.titre },
          { id: mission.employer_id, email: mission.email, prenom: mission.prenom, denomination: mission.denomination },
          statut,
          id,
          type
        );
      }
    } catch (notifError) {
      console.error('Erreur notification changement statut mission:', notifError);
    }

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: { id, statut }
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une mission
exports.deleteMission = async (req, res, next) => {

  try {
    const { id } = req.params;
    const { type } = req.query; // 'hourly' ou 'fixed'

    if (!type || (type !== 'hourly' && type !== 'fixed')) {
      return res.status(400).json({
        success: false,
        message: 'Type de mission requis (hourly ou fixed)'
      });
    }

    const table = type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';

    // Vérifier que la mission existe
    const [mission] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);

    if (mission.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    // Supprimer la mission
    await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'Mission supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Log mission view and check limits
exports.logMissionViewAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, source } = req.body;
    
    if (!type) {
      return res.status(400).json({ success: false, message: 'Type de mission requis' });
    }

    const { checkMissionViewAccess, logMissionView } = require('../services/missionLimitService');
    
    // Check limits
    const access = await checkMissionViewAccess(req, id, type);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        code: access.code,
        message: access.message,
        forfait: access.forfait,
        limit: access.limit,
        viewed_count: access.viewedCount
      });
    }

    // Log the view if not already viewed
    if (!access.alreadyViewedCurrent) {
      await logMissionView(req.user.id, id, type, source || 'detail');
    }

    res.json({ success: true, access });
  } catch (error) {
    next(error);
  }
};
