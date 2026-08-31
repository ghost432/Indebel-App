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

    // Vérifier les crédits de l'employeur
    const [employerInfo] = await db.query(
      `SELECT id, solde_credits, role FROM users WHERE id = ?`,
      [employer_id]
    );

    if (employerInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non autorisé à publier des missions'
      });
    }

    const employer = employerInfo[0];
    let publishCost = 1;

    // Récupérer le coût configuré en admin (cout_missions_employer)
    const [costSetting] = await db.query(
      `SELECT setting_value FROM site_settings WHERE setting_key = 'cout_missions_employer'`
    );
    if (costSetting.length > 0 && costSetting[0].setting_value !== undefined) {
      publishCost = parseInt(costSetting[0].setting_value, 10) || 0;
    }

    if (req.user.role !== 'admin' && publishCost > 0) {
      if ((employer.solde_credits || 0) < publishCost) {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: `Solde de crédits insuffisant pour publier une mission. (${employer.solde_credits || 0} crédit(s) disponible(s), ${publishCost} nécessaire(s)).`,
          cost: publishCost,
          balance: employer.solde_credits || 0
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

    // Déduire les crédits si ce n'est pas un admin
    if (req.user.role !== 'admin' && publishCost > 0) {
      await db.query(`UPDATE users SET solde_credits = solde_credits - ? WHERE id = ?`, [publishCost, employer_id]);
      await db.query(
        `INSERT INTO historique_credits (user_id, type, montant, description) VALUES (?, "depense", ?, "Publication d'une mission")`,
        [employer_id, publishCost]
      );
    }

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

    // Vérifier les crédits de l'employeur
    const [employerInfo] = await db.query(
      `SELECT id, solde_credits, role FROM users WHERE id = ?`,
      [employer_id]
    );

    if (employerInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non autorisé à publier des missions'
      });
    }

    const employer = employerInfo[0];
    let publishCost = 1;

    // Récupérer le coût configuré en admin (cout_missions_employer)
    const [costSetting] = await db.query(
      `SELECT setting_value FROM site_settings WHERE setting_key = 'cout_missions_employer'`
    );
    if (costSetting.length > 0 && costSetting[0].setting_value !== undefined) {
      publishCost = parseInt(costSetting[0].setting_value, 10) || 0;
    }

    if (req.user.role !== 'admin' && publishCost > 0) {
      if ((employer.solde_credits || 0) < publishCost) {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: `Solde de crédits insuffisant pour publier une mission. (${employer.solde_credits || 0} crédit(s) disponible(s), ${publishCost} nécessaire(s)).`,
          cost: publishCost,
          balance: employer.solde_credits || 0
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

    // Déduire les crédits si ce n'est pas un admin
    if (req.user.role !== 'admin' && publishCost > 0) {
      await db.query(`UPDATE users SET solde_credits = solde_credits - ? WHERE id = ?`, [publishCost, employer_id]);
      await db.query(
        `INSERT INTO historique_credits (user_id, type, montant, description) VALUES (?, "depense", ?, "Publication d'une mission")`,
        [employer_id, publishCost]
      );
    }

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

    const normalizedType = ['hourly', 'forfait_horaire'].includes(type) ? 'hourly' : 'fixed';
    const standardTable = normalizedType === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
    let missions = [];

    if (source !== 'freelancer') {
      const [rows] = await db.query(
        `SELECT m.*, u.denomination, u.nom, u.prenom, u.email, u.telephone, u.photo_profil as photo, u.photo_profil as avatar, u.adresse as employer_adresse, u.statut_verification as statut_kyc, ? as mission_type, 'employer' as source
         FROM ${standardTable} m
         LEFT JOIN users u ON m.employer_id = u.id
         WHERE m.id = ?
         LIMIT 1`,
        [normalizedType, id]
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
                u.denomination, u.nom, u.prenom, u.email, u.telephone, u.photo_profil as photo, u.photo_profil as avatar, u.adresse as employer_adresse, u.statut_verification as statut_kyc, 'freelancer' as source
         FROM jobs_freelancer j
         LEFT JOIN users u ON j.freelancer_id = u.id
         WHERE j.id = ?
         LIMIT 1`,
        [id]
      );
      missions = rows;
    }

    if (missions.length === 0) {
      const [rows] = await db.query(
        `SELECT j.id, j.titre, j.description, j.statut, j.date_creation,
                u.denomination, u.nom, u.prenom, u.email, u.telephone, u.photo_profil as photo, u.photo_profil as avatar, u.adresse as employer_adresse, u.statut_verification as statut_kyc, 'employer' as source
         FROM jobs j
         LEFT JOIN users u ON j.employer_id = u.id
         WHERE j.id = ?
         LIMIT 1`,
        [id]
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

    let hourly = [];
    let fixed = [];
    let freelancerJobs = [];

    try {
      // Intent: Récupérer les missions taux horaire non ignorées et non postulées
      const [hRows] = await db.query(`
        SELECT m.*, u.denomination, u.nom, u.prenom, 'hourly' as mission_type
        FROM missions_forfait_horaire m
        LEFT JOIN users u ON m.employer_id = u.id
        LEFT JOIN missions_ignorees mi ON mi.mission_id = m.id 
          AND mi.mission_type = 'hourly' 
          AND mi.freelancer_id = ?
        WHERE m.statut = ? 
          AND mi.id IS NULL
          AND m.id NOT IN (SELECT job_id FROM applications WHERE freelancer_id = ? AND job_id IS NOT NULL)
          AND m.id NOT IN (SELECT mission_id FROM demandes_missions WHERE freelancer_id = ? AND mission_id IS NOT NULL)
        ORDER BY m.date_creation DESC
      `, [freelancer_id, 'ouvert', freelancer_id, freelancer_id]);
      hourly = hRows;

      // Intent: Récupérer les missions fixes non ignorées et non postulées
      const [fRows] = await db.query(`
        SELECT m.*, u.denomination, u.nom, u.prenom, 'fixed' as mission_type
        FROM missions_forfait_fixe m
        LEFT JOIN users u ON m.employer_id = u.id
        LEFT JOIN missions_ignorees mi ON mi.mission_id = m.id 
          AND mi.mission_type = 'fixed' 
          AND mi.freelancer_id = ?
        WHERE m.statut = ? 
          AND mi.id IS NULL
          AND m.id NOT IN (SELECT job_id FROM applications WHERE freelancer_id = ? AND job_id IS NOT NULL)
          AND m.id NOT IN (SELECT mission_id FROM demandes_missions WHERE freelancer_id = ? AND mission_id IS NOT NULL)
        ORDER BY m.date_creation DESC
      `, [freelancer_id, 'ouvert', freelancer_id, freelancer_id]);
      fixed = fRows;

      // Intent: Récupérer les missions de prestataires non ignorées et non postulées
      const [jRows] = await db.query(`
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
        WHERE j.statut = ? 
          AND mi.id IS NULL
          AND j.id NOT IN (SELECT job_id FROM applications WHERE freelancer_id = ? AND job_id IS NOT NULL)
          AND j.id NOT IN (SELECT mission_id FROM demandes_missions WHERE freelancer_id = ? AND mission_id IS NOT NULL)
        ORDER BY j.date_creation DESC
      `, [freelancer_id, 'ouvert', freelancer_id, freelancer_id]);
      freelancerJobs = jRows;
    } catch (dbErr) {
      console.warn('⚠️ Requête missions_ignorees a échoué, exécution du fallback sans table mi:', dbErr.message);
      const [hRows] = await db.query(`
        SELECT m.*, u.denomination, u.nom, u.prenom, 'hourly' as mission_type
        FROM missions_forfait_horaire m
        LEFT JOIN users u ON m.employer_id = u.id
        WHERE m.statut = 'ouvert'
          AND m.id NOT IN (SELECT job_id FROM applications WHERE freelancer_id = ? AND job_id IS NOT NULL)
          AND m.id NOT IN (SELECT mission_id FROM demandes_missions WHERE freelancer_id = ? AND mission_id IS NOT NULL)
        ORDER BY m.date_creation DESC
      `, [freelancer_id, freelancer_id]);
      hourly = hRows;

      const [fRows] = await db.query(`
        SELECT m.*, u.denomination, u.nom, u.prenom, 'fixed' as mission_type
        FROM missions_forfait_fixe m
        LEFT JOIN users u ON m.employer_id = u.id
        WHERE m.statut = 'ouvert'
          AND m.id NOT IN (SELECT job_id FROM applications WHERE freelancer_id = ? AND job_id IS NOT NULL)
          AND m.id NOT IN (SELECT mission_id FROM demandes_missions WHERE freelancer_id = ? AND mission_id IS NOT NULL)
        ORDER BY m.date_creation DESC
      `, [freelancer_id, freelancer_id]);
      fixed = fRows;

      const [jRows] = await db.query(`
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
        WHERE j.statut = 'ouvert'
          AND j.id NOT IN (SELECT job_id FROM applications WHERE freelancer_id = ? AND job_id IS NOT NULL)
          AND j.id NOT IN (SELECT mission_id FROM demandes_missions WHERE freelancer_id = ? AND mission_id IS NOT NULL)
        ORDER BY j.date_creation DESC
      `, [freelancer_id, freelancer_id]);
      freelancerJobs = jRows;
    }

    // Prioriser les missions dans la même ville du freelancer si elle est connue
    const missions = [...hourly, ...fixed, ...freelancerJobs].sort((a, b) => {
      if (freelancerCity) {
        const aMatches = a.ville_mission && a.ville_mission.toLowerCase().includes(freelancerCity.toLowerCase());
        const bMatches = b.ville_mission && b.ville_mission.toLowerCase().includes(freelancerCity.toLowerCase());
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
      }
      return new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime();
    });

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

    if (!['en_attente', 'ouvert', 'ferme', 'refuse', 'en_cours', 'termine', 'traite', 'retire_liste', 'terminer', 'traiter', 'retirer-liste', 'valider', 'accepter'].includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Normaliser le statut si nécessaire
    let targetStatut = statut;
    if (statut === 'valider' || statut === 'accepter' || statut === 'valide' || statut === 'accepte') {
      targetStatut = 'ouvert';
    } else if (statut === 'refuser') {
      targetStatut = 'refuse';
    } else if (statut === 'traiter') {
      targetStatut = 'traite';
    } else if (statut === 'retirer-liste') {
      targetStatut = 'retire_liste';
    } else if (statut === 'terminer') {
      targetStatut = 'termine';
    }

    let targetTable = null;
    if (type === 'hourly' || type === 'forfait_horaire') {
      targetTable = 'missions_forfait_horaire';
    } else if (type === 'fixed' || type === 'forfait_fixe') {
      targetTable = 'missions_forfait_fixe';
    } else if (source === 'freelancer' || source === 'jobs_freelancer' || type === 'jobs_freelancer') {
      targetTable = 'jobs_freelancer';
    }

    let mission = [];
    if (targetTable) {
      const [rows] = await db.query(`SELECT * FROM ${targetTable} WHERE id = ?`, [id]);
      mission = rows;
    }

    // Si non trouvée avec le type fourni, chercher dans toutes les tables
    if (mission.length === 0) {
      const tables = ['missions_forfait_horaire', 'missions_forfait_fixe', 'jobs_freelancer'];
      for (const tbl of tables) {
        const [rows] = await db.query(`SELECT * FROM ${tbl} WHERE id = ?`, [id]);
        if (rows.length > 0) {
          targetTable = tbl;
          mission = rows;
          break;
        }
      }
    }

    if (mission.length === 0 || !targetTable) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    // Mettre à jour le statut
    await db.query(`UPDATE ${targetTable} SET statut = ? WHERE id = ?`, [targetStatut, id]);

    // Notifier le recruteur / créateur du changement de statut
    try {
      const missionObj = mission[0];
      const ownerId = missionObj.employer_id || missionObj.freelancer_id;
      if (ownerId) {
        const [ownerData] = await db.query('SELECT id, email, prenom, denomination FROM users WHERE id = ?', [ownerId]);
        if (ownerData.length > 0) {
          const additionalNotif = require('../services/additionalNotifications');
          await additionalNotif.notifyMissionStatusChange(
            { titre: missionObj.titre },
            ownerData[0],
            targetStatut,
            id,
            type || 'hourly'
          );
        }
      }
    } catch (notifError) {
      console.error('Erreur notification changement statut mission:', notifError);
    }

    res.json({
      success: true,
      message: 'Statut de la mission mis à jour avec succès',
      data: { id, statut: targetStatut }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer la visibilité (statistiques d'affichage) d'une mission (admin)
exports.getMissionVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [summaryRows] = await db.query(
      `SELECT COUNT(*) as total_views,
              COUNT(DISTINCT user_id) as unique_viewers,
              MAX(viewed_at) as last_viewed_at
       FROM mission_page_views
       WHERE mission_id = ?`,
      [id]
    );

    const [viewers] = await db.query(
      `SELECT v.user_id,
              u.prenom,
              u.nom,
              u.email,
              u.role,
              u.denomination,
              COUNT(*) as views_count,
              MIN(v.viewed_at) as first_viewed_at,
              MAX(v.viewed_at) as last_viewed_at
       FROM mission_page_views v
       JOIN users u ON u.id = v.user_id
       WHERE v.mission_id = ?
       GROUP BY v.user_id, u.prenom, u.nom, u.email, u.role, u.denomination
       ORDER BY last_viewed_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        summary: summaryRows[0] || { total_views: 0, unique_viewers: 0, last_viewed_at: null },
        viewers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une mission
exports.deleteMission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, source } = req.query;

    let targetTable = null;
    if (type === 'hourly' || type === 'forfait_horaire') {
      targetTable = 'missions_forfait_horaire';
    } else if (type === 'fixed' || type === 'forfait_fixe') {
      targetTable = 'missions_forfait_fixe';
    } else if (source === 'freelancer' || source === 'jobs_freelancer' || type === 'jobs_freelancer') {
      targetTable = 'jobs_freelancer';
    }

    let mission = [];
    if (targetTable) {
      const [rows] = await db.query(`SELECT * FROM ${targetTable} WHERE id = ?`, [id]);
      mission = rows;
    }

    // Si non trouvée avec le type fourni, chercher dans toutes les tables de missions
    if (mission.length === 0) {
      const tables = ['missions_forfait_horaire', 'missions_forfait_fixe', 'jobs_freelancer'];
      for (const tbl of tables) {
        const [rows] = await db.query(`SELECT * FROM ${tbl} WHERE id = ?`, [id]);
        if (rows.length > 0) {
          targetTable = tbl;
          mission = rows;
          break;
        }
      }
    }

    if (mission.length === 0 || !targetTable) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    const missionData = mission[0];
    const ownerId = missionData.employer_id || missionData.freelancer_id;
    const missionTitre = missionData.titre || `Mission #${id}`;

    // 1. Notifier le recruteur (ou propriétaire de la mission)
    if (ownerId) {
      await db.query(
        'INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) VALUES (?, ?, ?, ?, ?, FALSE, NOW())',
        [
          ownerId,
          'warning',
          '🗑️ Mission supprimée par l\'administration',
          `Votre mission "${missionTitre}" a été supprimée par l'administration. Elle n'apparaîtra plus dans votre compte.`,
          '/employer/missions'
        ]
      );
    }

    // 2. Notifier tous les candidats ayant postulé à cette mission
    try {
      const [candidates] = await db.query(
        'SELECT DISTINCT freelancer_id FROM applications WHERE mission_id = ? OR job_id = ?',
        [id, id]
      );
      for (const candidate of candidates) {
        if (candidate.freelancer_id && candidate.freelancer_id !== ownerId) {
          await db.query(
            'INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) VALUES (?, ?, ?, ?, ?, FALSE, NOW())',
            [
              candidate.freelancer_id,
              'info',
              'ℹ️ Mission supprimée',
              `La mission "${missionTitre}" à laquelle vous aviez candidaté a été supprimée par l'administration.`,
              '/freelancer/applications'
            ]
          );
        }
      }
    } catch (notifErr) {
      console.error('Erreur notification candidats suppression mission:', notifErr);
    }

    // 3. Supprimer la mission de la base de données
    await db.query(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'Mission supprimée avec succès et notifications créées'
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
