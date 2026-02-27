const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');
const notificationService = require('../services/notificationService');

// Create application
exports.createApplication = async (req, res, next) => {
  try {
    const { job_id } = req.body;
    const freelancer_id = req.user.id;

    // Check plan limits
    const [userPlan] = await db.query(
      `SELECT f.max_postulations, f.nom as forfait_nom 
       FROM users u 
       JOIN forfaits f ON u.forfait_id = f.id 
       WHERE u.id = ?`,
      [freelancer_id]
    );

    if (userPlan.length > 0 && userPlan[0].max_postulations !== null) {
      const limit = userPlan[0].max_postulations;

      // Count applications for current month
      const [countMonth] = await db.query(
        `SELECT COUNT(*) as nb 
         FROM applications 
         WHERE freelancer_id = ? 
         AND MONTH(date_creation) = MONTH(CURRENT_DATE()) 
         AND YEAR(date_creation) = YEAR(CURRENT_DATE())`,
        [freelancer_id]
      );

      if (countMonth[0].nb >= limit) {
        return res.status(403).json({
          success: false,
          message: `La limite de ${limit} candidatures par mois pour votre forfait ${userPlan[0].forfait_nom} est atteinte. Passez au forfait supérieur pour postuler plus.`,
          code: 'LIMIT_REACHED'
        });
      }
    }

    // Try to find mission in both tables (hourly and fixed)
    let missionData = null;
    let missionType = null;

    // Check in missions_forfait_horaire
    const [hourlyMissions] = await db.query(
      'SELECT id, titre, employer_id FROM missions_forfait_horaire WHERE id = ?',
      [job_id]
    );

    if (hourlyMissions.length > 0) {
      missionData = hourlyMissions[0];
      missionType = 'hourly';
    } else {
      // Check in missions_forfait_fixe
      const [fixedMissions] = await db.query(
        'SELECT id, titre, employer_id FROM missions_forfait_fixe WHERE id = ?',
        [job_id]
      );

      if (fixedMissions.length > 0) {
        missionData = fixedMissions[0];
        missionType = 'fixed';
      } else {
        // Check in jobs_freelancer
        const [freelancerJobs] = await db.query(
          'SELECT id, titre, freelancer_id as employer_id FROM jobs_freelancer WHERE id = ?',
          [job_id]
        );

        if (freelancerJobs.length > 0) {
          missionData = freelancerJobs[0];
          missionType = 'freelancer';
        }
      }
    }

    // Also check in old jobs table for backward compatibility
    if (!missionData) {
      const [jobs] = await db.query(
        'SELECT id, titre, employer_id FROM jobs WHERE id = ?',
        [job_id]
      );

      if (jobs.length > 0) {
        missionData = jobs[0];
        missionType = 'job';
      }
    }

    if (!missionData) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    // Check if already applied
    const [existingApplication] = await db.query(
      'SELECT id FROM applications WHERE job_id = ? AND freelancer_id = ?',
      [job_id, freelancer_id]
    );

    if (existingApplication.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Vous avez déjà postulé à cette mission'
      });
    }

    // Create application
    const [result] = await db.query(
      'INSERT INTO applications (job_id, freelancer_id, statut) VALUES (?, ?, ?)',
      [job_id, freelancer_id, 'en_attente']
    );

    // Get employer and freelancer data
    const [employer] = await db.query(
      'SELECT email, denomination FROM users WHERE id = ?',
      [missionData.employer_id]
    );

    const [freelancer] = await db.query(
      'SELECT nom, prenom FROM users WHERE id = ?',
      [freelancer_id]
    );

    // Send notifications and emails
    if (employer.length > 0 && freelancer.length > 0) {
      const freelancerNom = `${freelancer[0].prenom || ''} ${freelancer[0].nom || ''}`.trim();
      await notificationService.notifyApplicationSent(
        freelancer_id,
        missionData.employer_id,
        missionData.titre,
        freelancerNom,
        employer[0].email,
        employer[0].denomination
      );

      // Notification supplémentaire pour le freelancer
      const additionalNotif = require('../services/additionalNotifications');
      const [freelancerEmail] = await db.query(
        'SELECT email FROM users WHERE id = ?',
        [freelancer_id]
      );

      if (freelancerEmail.length > 0) {
        await additionalNotif.sendApplicationSentNotification(
          freelancer_id,
          freelancerEmail[0].email,
          freelancerNom,
          missionData.titre
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Candidature envoyée avec succès',
      data: {
        id: result.insertId,
        job_id,
        freelancer_id,
        statut: 'en_attente'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all applications for a job (employer only)
exports.getJobApplications = async (req, res, next) => {
  try {
    const { job_id } = req.params;
    let employerId = null;

    // Vérifier d'abord dans la table jobs
    const [jobs] = await db.query(
      'SELECT employer_id FROM jobs WHERE id = ?',
      [job_id]
    );

    if (jobs.length > 0) {
      employerId = jobs[0].employer_id;
    } else {
      // Vérifier dans missions_forfait_fixe
      const [missionsFixed] = await db.query(
        'SELECT employer_id FROM missions_forfait_fixe WHERE id = ?',
        [job_id]
      );

      if (missionsFixed.length > 0) {
        employerId = missionsFixed[0].employer_id;
      } else {
        // Vérifier dans missions_forfait_horaire
        const [missionsHourly] = await db.query(
          'SELECT employer_id FROM missions_forfait_horaire WHERE id = ?',
          [job_id]
        );

        if (missionsHourly.length > 0) {
          employerId = missionsHourly[0].employer_id;
        } else {
          // Vérifier dans jobs_freelancer
          const [freelancerJobs] = await db.query(
            'SELECT freelancer_id as employer_id FROM jobs_freelancer WHERE id = ?',
            [job_id]
          );

          if (freelancerJobs.length > 0) {
            employerId = freelancerJobs[0].employer_id;
          }
        }
      }
    }

    // Si aucune mission trouvée
    if (!employerId) {
      return res.status(404).json({
        success: false,
        message: 'Offre non trouvée'
      });
    }

    // Vérifier autorisation
    if (employerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Get applications (applications peuvent être liées à n'importe quelle table de missions via job_id)
    const [applications] = await db.query(
      `SELECT a.*, 
              CONCAT(u.prenom, ' ', u.nom) as freelancer_nom,
              u.prenom as freelancer_prenom,
              u.nom as freelancer_nom_famille,
              u.email as freelancer_email
       FROM applications a
       LEFT JOIN users u ON a.freelancer_id = u.id
       WHERE a.job_id = ?
       ORDER BY a.date_creation DESC`,
      [job_id]
    );

    res.json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    next(error);
  }
};

// Get freelancer applications
exports.getFreelancerApplications = async (req, res, next) => {
  try {
    const freelancer_id = req.user.id;

    // Récupérer toutes les candidatures du freelancer
    const [applications] = await db.query(
      `SELECT a.* FROM applications a WHERE a.freelancer_id = ? ORDER BY a.date_creation DESC`,
      [freelancer_id]
    );

    // Enrichir chaque candidature avec les données de la mission et de l'employer
    const enrichedApplications = [];

    for (const app of applications) {
      let missionData = null;
      let employerData = null;

      // Chercher dans missions_forfait_horaire
      const [hourly] = await db.query(
        `SELECT m.titre, m.description, m.employer_id 
         FROM missions_forfait_horaire m 
         WHERE m.id = ?`,
        [app.job_id]
      );

      if (hourly.length > 0) {
        missionData = hourly[0];
      } else {
        // Chercher dans missions_forfait_fixe
        const [fixed] = await db.query(
          `SELECT m.titre, m.description, m.employer_id 
           FROM missions_forfait_fixe m 
           WHERE m.id = ?`,
          [app.job_id]
        );

        if (fixed.length > 0) {
          missionData = fixed[0];
        } else {
          // Chercher dans jobs (rétrocompatibilité)
          const [job] = await db.query(
            `SELECT j.titre, j.description, j.employer_id 
             FROM jobs j 
             WHERE j.id = ?`,
            [app.job_id]
          );

          if (job.length > 0) {
            missionData = job[0];
          } else {
            // Chercher dans jobs_freelancer
            const [freelancerJob] = await db.query(
              `SELECT j.titre, j.description, j.freelancer_id as employer_id 
               FROM jobs_freelancer j 
               WHERE j.id = ?`,
              [app.job_id]
            );

            if (freelancerJob.length > 0) {
              missionData = freelancerJob[0];
            }
          }
        }
      }

      // Récupérer les données de l'employer
      if (missionData && missionData.employer_id) {
        const [employer] = await db.query(
          `SELECT nom, denomination FROM users WHERE id = ?`,
          [missionData.employer_id]
        );

        if (employer.length > 0) {
          employerData = employer[0];
        }
      }

      // Enrichir la candidature
      enrichedApplications.push({
        ...app,
        job_titre: missionData?.titre || 'Mission non trouvée',
        job_description: missionData?.description || '',
        employer_nom: employerData?.nom || '',
        employer_denomination: employerData?.denomination || ''
      });
    }

    res.json({
      success: true,
      data: enrichedApplications,
      count: enrichedApplications.length
    });
  } catch (error) {
    next(error);
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Validate status
    const validStatuses = ['en_attente', 'accepte', 'refuse'];
    if (!validStatuses.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Check if application exists
    const [applications] = await db.query(
      `SELECT a.* FROM applications a WHERE a.id = ?`,
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    const application = applications[0];
    let employerId = null;

    // Chercher l'employer_id dans les différentes tables de missions
    const [jobs] = await db.query('SELECT employer_id FROM jobs WHERE id = ?', [application.job_id]);
    if (jobs.length > 0) {
      employerId = jobs[0].employer_id;
    } else {
      const [missionsFixed] = await db.query('SELECT employer_id FROM missions_forfait_fixe WHERE id = ?', [application.job_id]);
      if (missionsFixed.length > 0) {
        employerId = missionsFixed[0].employer_id;
      } else {
        const [missionsHourly] = await db.query('SELECT employer_id FROM missions_forfait_horaire WHERE id = ?', [application.job_id]);
        if (missionsHourly.length > 0) {
          employerId = missionsHourly[0].employer_id;
        } else {
          const [freelancerJobs] = await db.query('SELECT freelancer_id as employer_id FROM jobs_freelancer WHERE id = ?', [application.job_id]);
          if (freelancerJobs.length > 0) {
            employerId = freelancerJobs[0].employer_id;
          }
        }
      }
    }

    // Check authorization
    if (employerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Update status
    await db.query(
      'UPDATE applications SET statut = ? WHERE id = ?',
      [statut, id]
    );

    // Si accepté, vérifier si besoin de changer le statut de la mission
    if (statut === 'accepte') {
      const jobId = application.job_id;

      // Changer le statut de la mission de 'ouvert' à 'en_cours'
      await db.query(
        `UPDATE jobs SET statut = 'en_cours' WHERE id = ? AND statut = 'ouvert'`,
        [jobId]
      );

      // Créer une notification pour le freelancer
      await db.query(
        `INSERT INTO notifications (user_id, type, titre, message, lien) 
         VALUES (?, 'application_accepted', 'Candidature acceptée', 
         ?, 
         '/freelancer/applications')`,
        [application.freelancer_id, "Votre candidature a été acceptée! Contactez l'employeur pour plus de détails."]
      );
    }

    res.json({
      success: true,
      message: 'Statut de la candidature mis à jour'
    });
  } catch (error) {
    next(error);
  }
};

// Reject application with reason and send notification
exports.rejectApplicationWithReason = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    if (!motif || !motif.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le motif de refus est requis'
      });
    }

    // Check if application exists and get details
    const [applications] = await db.query(
      `SELECT a.*, u.email as freelancer_email, u.nom as freelancer_nom
       FROM applications a
       LEFT JOIN users u ON a.freelancer_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    const application = applications[0];
    let employerId = null;
    let jobTitre = '';

    // Chercher l'employer_id et le titre dans les différentes tables de missions
    const [jobs] = await db.query('SELECT employer_id, titre FROM jobs WHERE id = ?', [application.job_id]);
    if (jobs.length > 0) {
      employerId = jobs[0].employer_id;
      jobTitre = jobs[0].titre;
    } else {
      const [missionsFixed] = await db.query('SELECT employer_id, titre FROM missions_forfait_fixe WHERE id = ?', [application.job_id]);
      if (missionsFixed.length > 0) {
        employerId = missionsFixed[0].employer_id;
        jobTitre = missionsFixed[0].titre;
      } else {
        const [missionsHourly] = await db.query('SELECT employer_id, titre FROM missions_forfait_horaire WHERE id = ?', [application.job_id]);
        if (missionsHourly.length > 0) {
          employerId = missionsHourly[0].employer_id;
          jobTitre = missionsHourly[0].titre;
        } else {
          const [freelancerJobs] = await db.query('SELECT freelancer_id as employer_id, titre FROM jobs_freelancer WHERE id = ?', [application.job_id]);
          if (freelancerJobs.length > 0) {
            employerId = freelancerJobs[0].employer_id;
            jobTitre = freelancerJobs[0].titre;
          }
        }
      }
    }

    // Check authorization
    if (employerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Update status and save reason
    await db.query(
      'UPDATE applications SET statut = ?, motif_refus = ? WHERE id = ?',
      ['refuse', motif, id]
    );

    // Create notification for freelancer
    await db.query(
      `INSERT INTO notifications (user_id, type, titre, message, lien) 
       VALUES (?, 'application_rejected', 'Candidature refusée', ?, '/freelancer/applications')`,
      [application.freelancer_id, `Votre candidature pour "${jobTitre}" a été refusée. Motif: ${motif}`]
    );

    // Send email notification
    try {
      await sendEmail({
        to: application.freelancer_email,
        subject: `Candidature refusée - ${jobTitre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53e3e;">Candidature refusée</h2>
            <p>Bonjour ${application.freelancer_nom},</p>
            <p>Nous vous informons que votre candidature pour la mission "<strong>${jobTitre}</strong>" n'a malheureusement pas été retenue.</p>
            <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #c53030;">Motif du refus:</h3>
              <p style="margin-bottom: 0;">${motif}</p>
            </div>
            <p>Nous vous encourageons à consulter d'autres opportunités sur notre plateforme.</p>
            <p>Cordialement,<br>L'équipe Indebel</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi email refus:', emailError);
      // Continue même si l'email échoue
    }

    res.json({
      success: true,
      message: 'Candidature refusée et freelancer notifié'
    });
  } catch (error) {
    next(error);
  }
};

// Get application statistics
exports.getApplicationStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as accepte,
        SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as refuse
      FROM applications
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get applications by period (day, week, month)
exports.getApplicationsByPeriod = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    let dateFormat, limit, intervalType;

    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        limit = 30;
        intervalType = 'DAY';
        break;
      case 'week':
        dateFormat = '%Y-W%u';
        limit = 12;
        intervalType = 'WEEK';
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        limit = 12;
        intervalType = 'MONTH';
        break;
    }

    const query = `
      SELECT 
        DATE_FORMAT(date_creation, '${dateFormat}') as periode,
        COUNT(*) as total
      FROM applications
      WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ${limit} ${intervalType})
      GROUP BY DATE_FORMAT(date_creation, '${dateFormat}')
      ORDER BY periode ASC
    `;

    const [stats] = await db.query(query);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getApplicationsByPeriod:', error);
    next(error);
  }
};
