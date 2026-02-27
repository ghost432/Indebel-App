const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');

// Get all jobs with filters for freelancers
exports.getAllJobs = async (req, res, next) => {
  try {
    const {
      statut = 'ouvert',
      search,
      secteur,
      type_forfait,
      type_contrat,
      niveau_experience,
      competences,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    // Requête de base avec jointure pour les informations de l'employeur
    let query = `
      SELECT 
        j.*, 
        u.nom as employer_nom, 
        u.prenom as employer_prenom,
        u.denomination as employer_denomination,
        u.photo_profil as employer_photo,
        u.statut_verification as employer_verification,
        COUNT(DISTINCT a.id) as nombre_candidatures
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.statut = ?
    `;

    const params = [statut];

    // Filtres de recherche
    if (search) {
      query += ' AND (j.titre LIKE ? OR j.description LIKE ? OR u.denomination LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Filtre par secteur
    if (secteur) {
      query += ' AND j.secteur = ?';
      params.push(secteur);
    }

    // Filtre par type de forfait
    if (type_forfait) {
      query += ' AND j.type_forfait = ?';
      params.push(type_forfait);
    }

    // Filtre par type de contrat
    if (type_contrat) {
      query += ' AND j.type_contrat = ?';
      params.push(type_contrat);
    }

    // Filtre par niveau d'expérience
    if (niveau_experience) {
      query += ' AND j.niveau_experience = ?';
      params.push(niveau_experience);
    }

    // Filtre par compétences (si l'utilisateur est un freelancer)
    if (req.user?.role === 'freelancer' && competences) {
      const competencesList = Array.isArray(competences) ? competences : [competences];
      competencesList.forEach((competence, index) => {
        query += ` AND JSON_CONTAINS(j.competences_requises, ?)`;
        params.push(JSON.stringify(competence));
      });
    }

    // Grouper par ID de job pour éviter les doublons
    query += ' GROUP BY j.id';

    // Construire la requête COUNT séparément avec les mêmes conditions WHERE
    let countQuery = `
      SELECT COUNT(DISTINCT j.id) as total 
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
      WHERE j.statut = ?
    `;

    const countParams = [statut];

    if (search) {
      countQuery += ' AND (j.titre LIKE ? OR j.description LIKE ? OR u.denomination LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (secteur) {
      countQuery += ' AND j.secteur = ?';
      countParams.push(secteur);
    }

    if (type_forfait) {
      countQuery += ' AND j.type_forfait = ?';
      countParams.push(type_forfait);
    }

    if (type_contrat) {
      countQuery += ' AND j.type_contrat = ?';
      countParams.push(type_contrat);
    }

    if (niveau_experience) {
      countQuery += ' AND j.niveau_experience = ?';
      countParams.push(niveau_experience);
    }

    if (req.user?.role === 'freelancer' && competences) {
      const competencesList = Array.isArray(competences) ? competences : [competences];
      competencesList.forEach((competence) => {
        countQuery += ` AND JSON_CONTAINS(j.competences_requises, ?)`;
        countParams.push(JSON.stringify(competence));
      });
    }

    // Compter le nombre total de résultats pour la pagination
    const [countResult] = await db.query(countQuery, countParams);

    const totalItems = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Ajouter le tri et la pagination
    query += ' ORDER BY j.date_creation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    // Exécuter la requête principale
    const [jobs] = await db.query(query, params);

    // Formater les données de sortie
    const formattedJobs = jobs.map(job => ({
      ...job,
      competences_requises: job.competences_requises ? JSON.parse(job.competences_requises) : [],
      employer: {
        id: job.employer_id,
        nom: job.employer_nom,
        prenom: job.employer_prenom,
        denomination: job.employer_denomination,
        photo_profil: job.employer_photo,
        verifie: job.employer_verification === 'verifie'
      },
      // Supprimer les champs inutiles
      employer_id: undefined,
      employer_nom: undefined,
      employer_prenom: undefined,
      employer_denomination: undefined,
      employer_photo: undefined,
      employer_verification: undefined
    }));

    res.json({
      success: true,
      data: formattedJobs,
      pagination: {
        totalItems,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des emplois:', error);
    next(error);
  }
};

// Get job by ID
exports.getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [jobs] = await db.query(
      `SELECT j.*, u.nom as employer_nom, u.email as employer_email
       FROM jobs j
       LEFT JOIN users u ON j.employer_id = u.id
       WHERE j.id = ?`,
      [id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offre non trouvée'
      });
    }

    res.json({
      success: true,
      data: jobs[0]
    });
  } catch (error) {
    next(error);
  }
};

// Create new job
exports.createJob = async (req, res, next) => {
  const transaction = await db.getConnection();

  try {
    await transaction.beginTransaction();

    const {
      titre,
      description,
      localisation,
      secteur,
      competences_requises = [],
      niveau_experience,
      type_forfait,
      taux_horaire,
      heures_estimees,
      budget_fixe,
      salaire_min,
      salaire_max,
      date_debut,
      duree,
      type_contrat
    } = req.body;

    let statut = req.body.statut || 'ouvert';
    const employer_id = req.user.id;
    const is_freelancer_job = req.user.role === 'freelancer';

    // Si c'est un freelancer, la mission est en attente de validation
    if (is_freelancer_job) {
      statut = 'en_attente_validation';
    }

    // Vérifier si l'utilisateur a le droit de publier (forfait)
    const [userPlan] = await transaction.query(
      `SELECT f.peut_publier_missions, f.max_missions, 
              u.forfait_date_expiration,
              (SELECT COUNT(*) FROM jobs WHERE employer_id = ?) as current_missions
       FROM users u
       JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ?`,
      [employer_id, employer_id]
    );

    if (userPlan.length === 0 || !userPlan[0].peut_publier_missions) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Votre forfait ne vous permet pas de publier des missions.'
      });
    }

    // Vérifier l'expiration du forfait
    if (userPlan[0].forfait_date_expiration) {
      const now = new Date();
      const expirationDate = new Date(userPlan[0].forfait_date_expiration);
      if (now > expirationDate) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          expired: true,
          message: 'Votre forfait a expiré. Veuillez le renouveler pour continuer à publier des missions.'
        });
      }
    }

    if (userPlan[0].max_missions !== null && userPlan[0].current_missions >= userPlan[0].max_missions) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: `Vous avez atteint la limite de ${userPlan[0].max_missions} missions pour votre forfait.`
      });
    }

    // Insert job with all fields
    const [result] = await transaction.query(
      `INSERT INTO jobs (
        titre, description, employer_id, is_freelancer_job, statut, localisation, 
        secteur, competences_requises, niveau_experience, type_forfait, 
        taux_horaire, heures_estimees, budget_fixe, salaire_min, 
        salaire_max, date_debut, duree, type_contrat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titre,
        description,
        employer_id,
        is_freelancer_job ? 1 : 0,
        statut,
        localisation,
        secteur,
        JSON.stringify(competences_requises),
        niveau_experience,
        type_forfait,
        taux_horaire,
        heures_estimees,
        budget_fixe,
        salaire_min,
        salaire_max,
        date_debut,
        duree,
        type_contrat
      ]
    );

    // Si c'est un freelancer, on notifie les admins et on ne notifie pas les autres prestataires tout de suite
    if (is_freelancer_job) {
      // Notifier les admins
      const [admins] = await transaction.query('SELECT id, email FROM users WHERE role = "admin"');

      const notificationPromises = admins.map(admin =>
        transaction.query(
          `INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            admin.id,
            'freelancer_job_validation',
            '📋 Nouvelle mission de prestataire à valider',
            `Le prestataire ${req.user.prenom} ${req.user.nom} a soumis une mission: "${titre}".`,
            '/admin/missions-prestataires',
            false
          ]
        )
      );
      await Promise.all(notificationPromises);

      // Notification au prestataire (publisher)
      await transaction.query(
        `INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          employer_id,
          'mission_pending',
          '⏳ Mission en attente de validation',
          `Votre mission "${titre}" a bien été enregistrée et est en cours de validation par notre équipe.`,
          '/freelancer/my-published-jobs',
          false
        ]
      );

      // Email au prestataire (publisher)
      try {
        await sendEmail(emailTemplates.missionPendingRecruiter(
          { titre },
          { prenom: req.user.prenom, email: req.user.email, denomination: req.user.denomination }
        ));
      } catch (err) {
        console.error('Erreur email pending freelancer mission:', err);
      }

      // Email aux admins
      try {
        await sendEmail(emailTemplates.newFreelancerMissionAdmin(
          { titre, localisation, type_forfait: type_forfait }, // Fixed type_forfait here too
          { prenom: req.user.prenom, nom: req.user.nom, email: req.user.email }
        ));
      } catch (err) {
        console.error('Erreur email admin freelancer job:', err);
      }

      await transaction.commit();
      return res.status(201).json({
        success: true,
        message: 'Mission soumise avec succès. Elle sera validée par l\'administrateur sous peu.',
        data: { id: result.insertId, titre, status: 'en_attente_validation' }
      });
    }

    // Récupérer les freelancers correspondant aux critères
    const [freelancers] = await transaction.query(
      `SELECT u.id, u.email, u.nom, u.prenom, u.competences, u.secteur
       FROM users u
       WHERE u.role = 'freelancer' 
       AND u.statut_verification = 'verifie'
       AND (
         ? = '' OR u.secteur = ? OR 
         JSON_CONTAINS(u.competences, ?) OR
         JSON_OVERLAPS(u.competences_recherchees, ?)
       )`,
      [
        secteur || '',
        secteur,
        JSON.stringify(competences_requises),
        JSON.stringify(competences_requises)
      ]
    );

    // Envoyer des notifications aux freelancers correspondants
    for (const freelancer of freelancers) {
      try {
        // Créer une notification en base de données
        await transaction.query(
          `INSERT INTO notifications (
            user_id, type, titre, message, lien, lu, date_creation
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            freelancer.id,
            'new_job',
            'Nouvelle mission correspondant à votre profil',
            `Une nouvelle mission "${titre}" a été publiée dans votre secteur.`,
            `/freelancer/jobs/${result.insertId}`,
            false
          ]
        );

        // Envoyer un email
        await sendEmail(emailTemplates.newJobNotification(
          freelancer.email,
          `${freelancer.prenom} ${freelancer.nom}`,
          titre,
          description,
          `/freelancer/jobs/${result.insertId}`
        ));
      } catch (emailError) {
        console.error(`Erreur d'envoi d'email à ${freelancer.email}:`, emailError);
        // Ne pas arrêter le processus en cas d'erreur d'email
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Offre créée avec succès',
      data: {
        id: result.insertId,
        titre,
        description,
        employer_id,
        statut
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update job
exports.updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titre, description, statut } = req.body;
    const employer_id = req.user.id;

    // Check if job exists and belongs to employer
    const [existingJob] = await db.query(
      'SELECT employer_id FROM jobs WHERE id = ?',
      [id]
    );

    if (existingJob.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offre non trouvée'
      });
    }

    if (existingJob[0].employer_id !== employer_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette offre'
      });
    }

    // Update job
    await db.query(
      'UPDATE jobs SET titre = ?, description = ?, statut = ? WHERE id = ?',
      [titre, description, statut, id]
    );

    res.json({
      success: true,
      message: 'Offre mise à jour avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Delete job
exports.deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employer_id = req.user.id;

    // Check if job exists and belongs to employer
    const [existingJob] = await db.query(
      'SELECT employer_id FROM jobs WHERE id = ?',
      [id]
    );

    if (existingJob.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offre non trouvée'
      });
    }

    if (existingJob[0].employer_id !== employer_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer cette offre'
      });
    }

    // Delete job
    await db.query('DELETE FROM jobs WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Offre supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Get employer jobs
exports.getEmployerJobs = async (req, res, next) => {
  try {
    const employer_id = req.user.id;

    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE employer_id = ? ORDER BY date_creation DESC',
      [employer_id]
    );

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    next(error);
  }
};

// Get job statistics
exports.getJobStats = async (req, res, next) => {
  try {
    // Note: The 'jobs' table is currently empty in the database.
    // If 'jobs' refers to a different entity than missions_forfait_*, 
    // we should count it separately.
    const [jobStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN statut = 'ouvert' THEN 1 ELSE 0 END), 0) as ouverts,
        COALESCE(SUM(CASE WHEN statut = 'ferme' THEN 1 ELSE 0 END), 0) as fermes,
        COALESCE(SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END), 0) as en_cours
      FROM jobs
    `);

    res.json({
      success: true,
      data: {
        total_jobs: jobStats[0]?.total || 0,
        jobs_ouverts: jobStats[0]?.ouverts || 0,
        jobs_fermes: jobStats[0]?.fermes || 0,
        jobs_en_cours: jobStats[0]?.en_cours || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get freelancer jobs for admin validation
exports.getFreelancerJobsForAdmin = async (req, res, next) => {
  try {
    const { statut = 'en_attente_validation' } = req.query;

    const [jobs] = await db.query(
      `SELECT j.*, u.nom, u.prenom, u.email, u.denomination, u.photo_profil
       FROM jobs j
       JOIN users u ON j.employer_id = u.id
       WHERE j.is_freelancer_job = 1 AND j.statut = ?
       ORDER BY j.date_creation DESC`,
      [statut]
    );

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

// Approve a freelancer mission
exports.approveFreelancerMission = async (req, res, next) => {
  const transaction = await db.getConnection();
  try {
    await transaction.beginTransaction();
    const { id } = req.params;

    const [jobs] = await transaction.query(
      `SELECT j.*, u.prenom, u.nom, u.email 
       FROM jobs j 
       JOIN users u ON j.employer_id = u.id 
       WHERE j.id = ? AND j.is_freelancer_job = 1`,
      [id]
    );

    if (jobs.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }

    const job = jobs[0];

    // Mettre à jour le statut
    await transaction.query(
      'UPDATE jobs SET statut = "ouvert" WHERE id = ?',
      [id]
    );

    // Notifier le prestataire
    await transaction.query(
      `INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        job.employer_id,
        'job_approved',
        '✅ Mission approuvée',
        `Votre mission "${job.titre}" a été validée et est maintenant publique.`,
        '/freelancer/my-published-jobs',
        false
      ]
    );

    // Email au prestataire
    try {
      await sendEmail(emailTemplates.freelancerMissionApproved(
        { titre: job.titre },
        { prenom: job.prenom, email: job.email }
      ));
    } catch (err) {
      console.error('Erreur email approval freelancer:', err);
    }

    // Récupérer et notifier les freelancers correspondants (comme dans createJob)
    const [freelancers] = await transaction.query(
      `SELECT u.id, u.email, u.nom, u.prenom, u.competences, u.secteur
       FROM users u
       WHERE u.role = 'freelancer' 
       AND u.statut_verification = 'verifie'
       AND u.id != ?
       AND (
         ? = '' OR u.secteur = ? OR 
         JSON_CONTAINS(u.competences, ?) OR
         JSON_OVERLAPS(u.competences_recherchees, ?)
       )`,
      [
        job.employer_id, // Ne pas notifier le créateur
        job.secteur || '',
        job.secteur,
        job.competences_requises,
        job.competences_requises
      ]
    );

    for (const freelancer of freelancers) {
      try {
        await transaction.query(
          `INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            freelancer.id,
            'new_job',
            'Nouvelle mission correspondant à votre profil',
            `Une nouvelle mission "${job.titre}" a été publiée dans votre secteur.`,
            `/freelancer/jobs/${id}`,
            false
          ]
        );

        await sendEmail(emailTemplates.newJobNotification(
          freelancer.email,
          job.titre,
          job.description,
          `/freelancer/jobs/${id}`
        ));
      } catch (err) {
        console.error(`Erreur notification freelancer ${freelancer.email}:`, err);
      }
    }

    await transaction.commit();
    res.json({
      success: true,
      message: 'Mission approuvée avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  } finally {
    transaction.release();
  }
};
// Reject a freelancer mission
exports.rejectFreelancerMission = async (req, res, next) => {
  const transaction = await db.getConnection();
  try {
    await transaction.beginTransaction();
    const { id } = req.params;

    const [jobs] = await transaction.query(
      `SELECT j.*, u.prenom, u.nom, u.email 
       FROM jobs j 
       JOIN users u ON j.employer_id = u.id 
       WHERE j.id = ? AND j.is_freelancer_job = 1`,
      [id]
    );

    if (jobs.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }

    const job = jobs[0];

    // Mettre à jour le statut
    await transaction.query(
      'UPDATE jobs SET statut = "refuse" WHERE id = ?',
      [id]
    );

    // Notifier le prestataire
    await transaction.query(
      `INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        job.employer_id,
        'job_rejected',
        '❌ Mission refusée',
        `Votre mission "${job.titre}" n'a pas été validée par notre équipe.`,
        '/freelancer/my-published-jobs',
        false
      ]
    );

    // Email au prestataire
    try {
      await sendEmail(emailTemplates.missionRefusedRecruiter(
        { titre: job.titre },
        { prenom: job.prenom, email: job.email }
      ));
    } catch (err) {
      console.error('Erreur email rejection freelancer:', err);
    }

    await transaction.commit();
    res.json({
      success: true,
      message: 'Mission refusée avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  } finally {
    transaction.release();
  }
};
