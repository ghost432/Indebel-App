const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('../services/notificationService');

// Créer une demande (freelancer postule à une mission)
exports.createDemande = async (req, res, next) => {
  try {
    const { mission_id, mission_type, message_freelancer, est_genere_par_ia = false } = req.body;
    const freelancer_id = req.user.id;

    // Vérifier le forfait et le statut de vérification du freelancer
    const [freelancerInfo] = await db.query(
      `SELECT u.forfait_id, u.forfait_date_expiration, u.statut_verification, f.nom as forfait_nom
       FROM users u
       LEFT JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ? AND u.role = 'freelancer'`,
      [freelancer_id]
    );

    if (freelancerInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non autorisé à postuler'
      });
    }

    const freelancerData = freelancerInfo[0];

    // Vérifier si le profil est vérifié
    if (freelancerData.statut_verification !== 'verifie') {
      return res.status(403).json({
        success: false,
        message: 'Vous devez faire vérifier votre identité pour postuler aux missions',
        code: 'NOT_VERIFIED'
      });
    }

    // Vérifier si le forfait existe
    if (!freelancerData.forfait_id) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez souscrire à un forfait pour postuler aux missions',
        code: 'NO_FORFAIT'
      });
    }

    // Vérifier si le forfait est expiré
    if (freelancerData.forfait_date_expiration && new Date(freelancerData.forfait_date_expiration) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Votre forfait a expiré. Veuillez le renouveler pour postuler aux missions.',
        code: 'FORFAIT_EXPIRED'
      });
    }

    // Récupérer le max_missions du forfait
    const [forfaitInfo] = await db.query(
      `SELECT f.max_missions, f.nom as forfait_nom
       FROM forfaits f
       WHERE f.id = ?`,
      [freelancerData.forfait_id]
    );

    if (forfaitInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forfait introuvable'
      });
    }

    const forfait = forfaitInfo[0];

    // Vérifier la limite de candidatures si définie
    if (forfait.max_missions !== null) {
      const [[{ count: demandesCount }]] = await db.query(
        `SELECT COUNT(*) as count 
         FROM demandes_missions 
         WHERE freelancer_id = ? 
         AND statut IN ('en_attente', 'acceptee')`,
        [freelancer_id]
      );

      if (demandesCount >= forfait.max_missions) {
        return res.status(403).json({
          success: false,
          message: `Vous avez atteint la limite de candidatures de votre forfait ${forfait.forfait_nom} (${forfait.max_missions} candidatures actives). Mettez à niveau votre forfait pour postuler à plus de missions.`,
          code: 'MAX_CANDIDATURES_REACHED',
          data: {
            currentCandidatures: demandesCount,
            maxCandidatures: forfait.max_missions
          }
        });
      }
    }

    // Récupérer les informations de la mission et de l'employer
    let tableName = mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
    let [missions] = await db.query(
      `SELECT m.*, u.email as employer_email, u.denomination, u.nom as employer_nom, u.prenom as employer_prenom
       FROM ${tableName} m
       JOIN users u ON m.employer_id = u.id
       WHERE m.id = ?`,
      [mission_id]
    );

    let isFreelancerJob = false;
    if (missions.length === 0) {
      // Ressayer dans jobs_freelancer
      [missions] = await db.query(
        `SELECT j.id, j.titre, j.statut, j.freelancer_id as employer_id, 
                u.email as employer_email, u.denomination, u.nom as employer_nom, u.prenom as employer_prenom
         FROM jobs_freelancer j
         JOIN users u ON j.freelancer_id = u.id
         WHERE j.id = ? AND j.type_forfait = ?`,
        [mission_id, mission_type]
      );

      if (missions.length > 0) {
        isFreelancerJob = true;
      }
    }

    if (missions.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }

    const mission = missions[0];

    // Vérifier que la mission est ouverte
    if (mission.statut !== 'ouvert') {
      return res.status(400).json({
        success: false,
        message: 'Cette mission n\'est plus ouverte aux candidatures'
      });
    }

    // Vérifier si une demande existe déjà
    const [existing] = await db.query(
      'SELECT id FROM demandes_missions WHERE mission_id = ? AND mission_type = ? AND freelancer_id = ?',
      [mission_id, mission_type, freelancer_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà postulé à cette mission'
      });
    }

    // Récupérer les infos du freelancer
    const [freelancers] = await db.query(
      'SELECT prenom, nom, email, telephone FROM users WHERE id = ?',
      [freelancer_id]
    );
    const freelancer = freelancers[0];

    // Créer la demande
    const [result] = await db.query(
      `INSERT INTO demandes_missions 
       (mission_id, mission_type, freelancer_id, employer_id, message_freelancer, statut, is_freelancer_job, est_genere_par_ia) 
       VALUES (?, ?, ?, ?, ?, 'en_attente', ?, ?)`,
      [mission_id, mission_type, freelancer_id, mission.employer_id, message_freelancer, isFreelancerJob ? 1 : 0, est_genere_par_ia ? 1 : 0]
    );

    // Envoyer un email à l'employeur et créer notification
    const employerName = mission.denomination || `${mission.employer_prenom} ${mission.employer_nom}`;
    const freelancerName = `${freelancer.prenom} ${freelancer.nom}`;

    // Envoyer email et notification (ne pas bloquer si erreur)
    try {
      console.log(`📧 Envoi email à l'employeur: ${mission.employer_email}`);
      await sendEmail({
        to: mission.employer_email,
        subject: `Nouvelle demande pour votre mission "${mission.titre}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Nouvelle demande reçue</h2>
            <p>Bonjour ${employerName},</p>
            <p>L'<strong>Prestataire ${freelancerName}</strong> souhaite travailler sur votre mission :</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1F2937;">${mission.titre}</h3>
              <p style="color: #6B7280; margin: 10px 0;">
                <strong>Type :</strong> ${mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
              </p>
            </div>

            ${message_freelancer ? `
              <div style="margin: 20px 0;">
                <h4 style="color: #1F2937;">Message de le Prestataire :</h4>
                <p style="color: #4B5563; font-style: italic;">"${message_freelancer}"</p>
              </div>
            ` : ''}

            <div style="margin: 20px 0;">
              <p><strong>Coordonnées de le Prestataire :</strong></p>
              <ul style="color: #4B5563;">
                <li>Nom complet : <strong>${freelancerName}</strong></li>
                <li>Email : ${freelancer.email}</li>
                ${freelancer.telephone ? `<li>Téléphone : ${freelancer.telephone}</li>` : ''}
              </ul>
            </div>

            <p style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/employer/demandes" 
                 style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir la demande
              </a>
            </p>

            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              Cordialement,<br>
              L'équipe Indebel
            </p>
          </div>
        `
      });
      console.log(`✅ Email envoyé à l'employeur ${employerName}`);
    } catch (emailError) {
      console.error('❌ Erreur envoi email à l\'employeur:', emailError.message);
    }

    // Créer une notification pour l'employeur
    try {
      console.log(`🔔 Création notification pour l'employeur ID: ${mission.employer_id}`);
      await notificationService.createNotification(
        mission.employer_id,
        'demande',
        `📋 Nouvelle demande pour "${mission.titre}"`,
        `Le Prestataire ${freelancerName} souhaite travailler sur votre mission.`,
        {
          demande_id: result.insertId,
          mission_id: mission_id,
          mission_type: mission_type,
          freelancer_id: freelancer_id,
          freelancer_name: freelancerName
        }
      );
      console.log(`✅ Notification créée pour l'employeur ${employerName}`);
    } catch (notifError) {
      console.error('❌ Erreur création notification:', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Votre demande a été envoyée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les demandes reçues par un employeur
exports.getEmployerDemandes = async (req, res, next) => {
  try {
    const employer_id = req.user.id;

    const [demandes] = await db.query(
      `SELECT 
        d.*,
        u.prenom as freelancer_prenom,
        u.nom as freelancer_nom,
        u.email as freelancer_email,
        u.telephone as freelancer_telephone,
        u.secteur as freelancer_secteur
       FROM demandes_missions d
       JOIN users u ON d.freelancer_id = u.id
       WHERE d.employer_id = ?
       ORDER BY d.date_demande DESC`,
      [employer_id]
    );

    // Récupérer les titres des missions
    for (let demande of demandes) {
      let titleResult;
      if (demande.is_freelancer_job) {
        titleResult = await db.query(
          `SELECT titre FROM jobs_freelancer WHERE id = ?`,
          [demande.mission_id]
        );
      } else {
        const tableName = demande.mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
        titleResult = await db.query(
          `SELECT titre FROM ${tableName} WHERE id = ?`,
          [demande.mission_id]
        );
      }
      demande.mission_titre = titleResult[0][0]?.titre || 'Mission supprimée';
    }

    res.json({ success: true, data: demandes });
  } catch (error) {
    next(error);
  }
};

// Récupérer les demandes envoyées par un freelancer
exports.getFreelancerDemandes = async (req, res, next) => {
  try {
    const freelancer_id = req.user.id;
    console.log(`🔍 Récupération demandes pour freelancer ID: ${freelancer_id}`);

    const [demandes] = await db.query(
      `SELECT 
        d.*,
        u.denomination as employer_denomination,
        u.nom as employer_nom,
        u.prenom as employer_prenom
       FROM demandes_missions d
       JOIN users u ON d.employer_id = u.id
       WHERE d.freelancer_id = ?
       ORDER BY d.date_demande DESC`,
      [freelancer_id]
    );

    console.log(`📋 ${demandes.length} demande(s) trouvée(s) pour freelancer ${freelancer_id}`);

    // Récupérer les titres des missions
    for (let demande of demandes) {
      let missionResult;
      if (demande.is_freelancer_job) {
        [missionResult] = await db.query(
          `SELECT titre, statut FROM jobs_freelancer WHERE id = ?`,
          [demande.mission_id]
        );
      } else {
        const tableName = demande.mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
        [missionResult] = await db.query(
          `SELECT titre, statut FROM ${tableName} WHERE id = ?`,
          [demande.mission_id]
        );
      }
      demande.mission_titre = missionResult[0]?.titre || 'Mission supprimée';
      demande.mission_statut = missionResult[0]?.statut || null;
      console.log(`  ✅ Demande ${demande.id}: ${demande.mission_titre} (${demande.statut})`);
    }

    res.json({ success: true, data: demandes });
  } catch (error) {
    console.error('❌ Erreur getFreelancerDemandes:', error);
    next(error);
  }
};

// Accepter une demande
exports.accepterDemande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const is_admin = req.user.role === 'admin';

    // Vérifier que la demande appartient à cet employeur (ou que c'est un admin)
    const whereClause = is_admin
      ? 'WHERE d.id = ?'
      : 'WHERE d.id = ? AND d.employer_id = ?';
    const queryParams = is_admin ? [id] : [id, user_id];

    const [demandes] = await db.query(
      `SELECT d.*, u.email as freelancer_email, u.prenom as freelancer_prenom, u.nom as freelancer_nom
       FROM demandes_missions d
       JOIN users u ON d.freelancer_id = u.id
       ${whereClause}`,
      queryParams
    );

    if (demandes.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const demande = demandes[0];

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Mettre à jour le statut de la demande
    await db.query(
      'UPDATE demandes_missions SET statut = "accepte", date_reponse = NOW() WHERE id = ?',
      [id]
    );

    // Mettre à jour le statut de la mission en "en_cours"
    let missionTitre = 'Mission';
    if (demande.is_freelancer_job) {
      const [missions] = await db.query(
        `SELECT titre FROM jobs_freelancer WHERE id = ?`,
        [demande.mission_id]
      );
      missionTitre = missions[0]?.titre || 'Mission';

      await db.query(
        `UPDATE jobs_freelancer SET statut = 'en_cours' WHERE id = ?`,
        [demande.mission_id]
      );
    } else {
      const tableName = demande.mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
      const [missions] = await db.query(
        `SELECT titre FROM ${tableName} WHERE id = ?`,
        [demande.mission_id]
      );
      missionTitre = missions[0]?.titre || 'Mission';

      await db.query(
        `UPDATE ${tableName} SET statut = 'en_cours' WHERE id = ?`,
        [demande.mission_id]
      );
    }

    // Récupérer les infos de l'employeur
    const [employers] = await db.query(
      'SELECT denomination, nom, prenom FROM users WHERE id = ?',
      [demande.employer_id]
    );
    const employer = employers[0];
    const employerName = employer.denomination || `${employer.prenom} ${employer.nom}`;

    // Envoyer un email au freelancer
    const freelancerName = `${demande.freelancer_prenom} ${demande.freelancer_nom}`;

    // Envoyer l'email de manière asynchrone pour ne pas bloquer la réponse
    sendEmail({
      to: demande.freelancer_email,
      subject: `Bonne nouvelle ! Votre candidature a été acceptée`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">🎉 Félicitations !</h2>
          <p>Bonjour ${freelancerName},</p>
          <p>Nous avons une excellente nouvelle pour vous !</p>
          
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="margin-top: 0; color: #065F46;">Votre candidature a été acceptée</h3>
            <p style="color: #047857; margin: 10px 0;">
              <strong>${employerName}</strong> a accepté votre candidature pour la mission :
            </p>
            <h4 style="color: #1F2937; margin: 10px 0;">"${missionTitre}"</h4>
          </div>

          <p style="margin-top: 20px;">
            <strong>La mission est maintenant en cours.</strong> Vous pouvez contacter le recruteur par message pour convenir des prochaines étapes.
          </p>

          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/freelancer/mes-messages" 
               style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Contacter le recruteur
            </a>
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Bon travail !<br>
            L'équipe Indebel
          </p>
        </div>
      `
    }).catch(err => {
      console.error('❌ Erreur envoi email acceptation:', err);
      // Ne pas bloquer la réponse si l'email échoue
    });

    // Créer une notification pour le freelancer
    try {
      await notificationService.createNotification(
        demande.freelancer_id,
        'demande',
        '✅ Candidature acceptée !',
        `Votre candidature pour "${missionTitre}" a été acceptée par ${employerName}. La mission est maintenant en cours.`,
        { demande_id: id, mission_id: demande.mission_id, mission_type: demande.mission_type }
      );
      console.log('✅ Notification acceptation créée pour freelancer');
    } catch (notifErr) {
      console.error('❌ Erreur création notification:', notifErr);
    }

    // Récupérer l'email de l'employeur et envoyer notification
    try {
      const [employerData] = await db.query(
        'SELECT email FROM users WHERE id = ?',
        [demande.employer_id]
      );

      if (employerData.length > 0) {
        await notificationService.notifyEmployerAcceptedApplication(
          demande.employer_id,
          employerData[0].email,
          employerName,
          freelancerName,
          missionTitre
        );
      }
    } catch (employerNotifErr) {
      console.error('❌ Erreur notification employeur:', employerNotifErr);
    }

    res.json({
      success: true,
      message: 'Demande acceptée avec succès. Le freelancer et vous avez été notifiés.'
    });
  } catch (error) {
    next(error);
  }
};

// Refuser une demande
exports.refuserDemande = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const is_admin = req.user.role === 'admin';

    // Vérifier que la demande appartient à cet employeur (ou que c'est un admin)
    const whereClause = is_admin
      ? 'WHERE d.id = ?'
      : 'WHERE d.id = ? AND d.employer_id = ?';
    const queryParams = is_admin ? [id] : [id, user_id];

    const [demandes] = await db.query(
      `SELECT d.*, u.email as freelancer_email, u.prenom as freelancer_prenom, u.nom as freelancer_nom
       FROM demandes_missions d
       JOIN users u ON d.freelancer_id = u.id
       ${whereClause}`,
      queryParams
    );

    if (demandes.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const demande = demandes[0];

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Mettre à jour le statut de la demande
    await db.query(
      'UPDATE demandes_missions SET statut = "refuse", date_reponse = NOW() WHERE id = ?',
      [id]
    );

    // Récupérer le titre de la mission
    let missionTitre = 'Mission';
    if (demande.is_freelancer_job) {
      const [missions] = await db.query(
        `SELECT titre FROM jobs_freelancer WHERE id = ?`,
        [demande.mission_id]
      );
      missionTitre = missions[0]?.titre || 'Mission';
    } else {
      const tableName = demande.mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
      const [missions] = await db.query(
        `SELECT titre FROM ${tableName} WHERE id = ?`,
        [demande.mission_id]
      );
      missionTitre = missions[0]?.titre || 'Mission';
    }

    // Récupérer les infos de l'employeur
    const [employers] = await db.query(
      'SELECT denomination, nom, prenom FROM users WHERE id = ?',
      [demande.employer_id]
    );
    const employer = employers[0];
    const employerName = employer.denomination || `${employer.prenom} ${employer.nom}`;

    // Envoyer un email au freelancer
    const freelancerName = `${demande.freelancer_prenom} ${demande.freelancer_nom}`;

    // Envoyer l'email de manière asynchrone pour ne pas bloquer la réponse
    sendEmail({
      to: demande.freelancer_email,
      subject: `Réponse à votre candidature - ${missionTitre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Réponse à votre candidature</h2>
          <p>Bonjour ${freelancerName},</p>
          
          <p>Nous vous remercions pour votre intérêt pour la mission :</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">"${missionTitre}"</h3>
            <p style="color: #6B7280; margin: 10px 0;">Publiée par <strong>${employerName}</strong></p>
          </div>

          <p>Malheureusement, votre candidature n'a pas été retenue pour cette mission.</p>
          
          <p style="margin-top: 20px;">
            Ne vous découragez pas ! De nombreuses autres opportunités vous attendent sur Indebel.
          </p>

          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/freelancer/list-missions" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir d'autres missions
            </a>
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Cordialement,<br>
            L'équipe Indebel
          </p>
        </div>
      `
    }).catch(err => {
      console.error('❌ Erreur envoi email refus:', err);
    });

    // Créer une notification pour le freelancer
    try {
      await notificationService.createNotification(
        demande.freelancer_id,
        'demande',
        '📋 Réponse à votre candidature',
        `Votre candidature pour "${missionTitre}" n'a pas été retenue. Ne vous découragez pas, de nouvelles opportunités vous attendent !`,
        { demande_id: id, mission_id: demande.mission_id, mission_type: demande.mission_type }
      );
      console.log('✅ Notification refus créée pour freelancer');
    } catch (notifErr) {
      console.error('❌ Erreur création notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Demande refusée. Le freelancer a été notifié.'
    });
  } catch (error) {
    next(error);
  }
};

// Terminer une mission
exports.terminerMission = async (req, res, next) => {
  try {
    const { mission_id, mission_type } = req.body;
    const employer_id = req.user.id;

    const tableName = mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';

    // Vérifier que la mission appartient à cet employeur
    const [missions] = await db.query(
      `SELECT id, statut FROM ${tableName} WHERE id = ? AND employer_id = ?`,
      [mission_id, employer_id]
    );

    if (missions.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }

    // Mettre à jour le statut
    await db.query(
      `UPDATE ${tableName} SET statut = 'termine' WHERE id = ?`,
      [mission_id]
    );

    res.json({
      success: true,
      message: 'Mission marquée comme terminée'
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer le compte de demandes par mission pour un employeur
exports.getDemandesCountByMission = async (req, res, next) => {
  try {
    const employer_id = req.user.id;
    console.log(`🔢 Récupération des comptes de demandes pour employeur ID: ${employer_id}`);

    const [counts] = await db.query(
      `SELECT 
        mission_id,
        mission_type,
        COUNT(*) as count,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente_count,
        SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as accepte_count
       FROM demandes_missions
       WHERE employer_id = ?
       GROUP BY mission_id, mission_type`,
      [employer_id]
    );

    console.log(`📊 ${counts.length} groupe(s) de demandes trouvé(s)`);

    // Formater en objet avec clé mission_type-mission_id
    const countsMap = {};
    counts.forEach(c => {
      const key = `${c.mission_type}-${c.mission_id}`;
      countsMap[key] = {
        total: c.count,
        en_attente: c.en_attente_count,
        accepte: c.accepte_count
      };
      console.log(`   ${key}: total=${c.count}, en_attente=${c.en_attente_count}, accepte=${c.accepte_count}`);
    });

    console.log(`✅ Comptes formatés:`, countsMap);
    res.json({ success: true, data: countsMap });
  } catch (error) {
    console.error('❌ Erreur getDemandesCountByMission:', error);
    next(error);
  }
};

// Récupérer toutes les demandes (admin uniquement)
exports.getAllDemandes = async (req, res, next) => {
  try {
    const [demandes] = await db.query(
      `SELECT 
        d.*,
        freelancer.prenom as freelancer_prenom,
        freelancer.nom as freelancer_nom,
        freelancer.email as freelancer_email,
        freelancer.telephone as freelancer_telephone,
        employer.denomination as employer_denomination,
        employer.nom as employer_nom,
        employer.prenom as employer_prenom
       FROM demandes_missions d
       JOIN users freelancer ON d.freelancer_id = freelancer.id
       JOIN users employer ON d.employer_id = employer.id
       ORDER BY d.date_demande DESC`
    );

    // Récupérer les titres des missions
    for (let demande of demandes) {
      let missionResult;
      if (demande.is_freelancer_job) {
        [missionResult] = await db.query(
          `SELECT titre, statut FROM jobs_freelancer WHERE id = ?`,
          [demande.mission_id]
        );
      } else {
        const tableName = demande.mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
        [missionResult] = await db.query(
          `SELECT titre, statut FROM ${tableName} WHERE id = ?`,
          [demande.mission_id]
        );
      }
      demande.mission_titre = missionResult[0]?.titre || 'Mission supprimée';
      demande.mission_statut = missionResult[0]?.statut || null;
    }

    res.json({
      success: true,
      data: demandes,
      count: demandes.length
    });
  } catch (error) {
    next(error);
  }
};

// Générer une candidature par IA
exports.generateAiCandidature = async (req, res, next) => {
  try {
    const { mission_id, mission_type, instructions_supplementaires = '' } = req.body;
    const freelancerId = req.user.id;

    if (!mission_id || !mission_type) {
      return res.status(400).json({ success: false, message: 'mission_id et mission_type sont obligatoires' });
    }

    const { checkAiCandidatureAccess, incrementAiCandidatureCounter } = require('../services/missionLimitService');
    const access = await checkAiCandidatureAccess(req);

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        code: access.code,
        message: access.message,
        limit: access.limit,
        currentCount: access.currentCount
      });
    }

    // Récupérer les informations de la mission
    let tableName = mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
    let [missions] = await db.query(
      `SELECT m.*, u.denomination, u.nom as employer_nom, u.prenom as employer_prenom
       FROM ${tableName} m
       JOIN users u ON m.employer_id = u.id
       WHERE m.id = ?`,
      [mission_id]
    );

    if (missions.length === 0) {
      // Ressayer dans jobs_freelancer
      [missions] = await db.query(
        `SELECT j.*, u.denomination, u.nom as employer_nom, u.prenom as employer_prenom
         FROM jobs_freelancer j
         JOIN users u ON j.freelancer_id = u.id
         WHERE j.id = ? AND j.type_forfait = ?`,
        [mission_id, mission_type]
      );
    }

    if (missions.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }

    const mission = missions[0];

    // Récupérer les infos du freelancer
    const [freelancers] = await db.query(
      'SELECT nom, prenom, denomination, competences FROM users WHERE id = ?',
      [freelancerId]
    );
    const freelancer = freelancers[0] || {};
    const providerName = freelancer.denomination || `${freelancer.prenom || ''} ${freelancer.nom || ''}`.trim();

    const promptText = `Tu es un assistant expert en rédaction de messages de candidature pour la plateforme freelance Indebel Belgique.
Rédige un message de motivation pertinent, poli et engageant en FRANÇAIS pour un prestataire qui postule à une mission.

INFORMATIONS DE LA MISSION:
- Titre: ${mission.titre || ''}
- Type: ${mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
- Catégorie: ${mission.categorie || mission.secteur || ''}
- Budget/Taux: ${mission_type === 'hourly' ? (mission.forfait_heure || mission.taux_horaire || '') + ' €/h' : (mission.forfait_mission || mission.budget_fixe || '') + ' €'}
- Description: ${mission.description || ''}

INFORMATIONS DU PRESTATAIRE:
- Nom/Entreprise: ${providerName}
- Compétences: ${freelancer.competences || 'Expert dans son domaine'}

${instructions_supplementaires ? `Consignes particulières: ${instructions_supplementaires}` : ''}

EXIGENCE DE SORTIE STRICTE:
Renvoie UNIQUEMENT un objet JSON valide avec une seule propriété "message_freelancer" contenant le texte de la candidature générée (sans balises ni format markdown autour du json). Exemple :
{
  "message_freelancer": "Bonjour,\\n\\nJe suis très intéressé par votre mission..."
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const aiRes = await fetch('https://ai.lestagiaire.be/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('admin:QmO2u1QfB99Zloha4Q').toString('base64')
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'cv-ai',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.7
      })
    });
    clearTimeout(timeoutId);

    const aiData = await aiRes.json();
    let message_freelancer = "Bonjour,\n\nJe suis très intéressé(e) par votre mission et j'ai l'expérience requise pour la mener à bien. N'hésitez pas à me contacter pour en discuter.\n\nCordialement.";

    if (aiData && aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
      const content = aiData.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const resultJson = JSON.parse(jsonMatch[0]);
          if (resultJson.message_freelancer) {
            message_freelancer = resultJson.message_freelancer;
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }
    }

    // Incrémenter le compteur IA
    await incrementAiCandidatureCounter(freelancerId);

    const disclaimerText = "\n\nLe montant indiqué est une estimation. Un devis définitif pourra être établi uniquement après une visite sur place, afin d'évaluer précisément les travaux à réaliser.\n\nJe reste à votre disposition pour convenir d'un rendez-vous.";
    message_freelancer += disclaimerText;

    res.json({
      success: true,
      data: {
        message_freelancer
      }
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Le service IA a mis trop de temps à répondre.' });
    }
    console.error('Erreur génération IA candidature:', error);
    next(error);
  }
};

module.exports = exports;
