const db = require('../config/database');
const { sendEmail, getAdminEmails } = require('../config/email');
const notificationService = require('../services/notificationService');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const starsText = (note) => '★'.repeat(parseInt(note) || 0) + '☆'.repeat(5 - (parseInt(note) || 0));

const emailShell = ({ title, children, ctaLabel, ctaUrl }) => `
  <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f6f8fc;padding:24px;color:#0f172a">
    <div style="background:#2A4DEF;color:#fff;border-radius:18px;padding:26px;margin-bottom:18px">
      <p style="margin:0 0 8px;color:#fecaca;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">Indebel</p>
      <h2 style="margin:0;font-size:24px;line-height:1.25">${title}</h2>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px">
      ${children}
      ${ctaLabel && ctaUrl ? `<p style="margin-top:22px"><a href="${ctaUrl}" style="background:#c02525;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:800;display:inline-block">${ctaLabel}</a></p>` : ''}
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:18px">Cordialement,<br>L'équipe Indebel</p>
  </div>
`;

const notifyAdmins = async (type, titre, message, data = null) => {
  const [admins] = await db.query('SELECT id FROM users WHERE role = "admin"');
  await Promise.allSettled(admins.map((admin) =>
    notificationService.createNotification(admin.id, type, titre, message, data)
  ));
};

const sendEvaluationFollowUps = async ({ evaluationId, note, commentaire, freelancerId, freelancerName, employerId, employerEmail, employerName }) => {
  const cleanFreelancerName = escapeHtml(freelancerName);
  const cleanEmployerName = escapeHtml(employerName);
  const cleanComment = escapeHtml(commentaire || '');
  const cleanStars = starsText(note);

  if (employerEmail) {
    try {
      await sendEmail({
        to: employerEmail,
        subject: `Votre évaluation pour ${freelancerName} a bien été enregistrée`,
        html: emailShell({
          title: 'Évaluation bien enregistrée',
          children: `
            <p>Bonjour <strong>${cleanEmployerName}</strong>,</p>
            <p>Votre évaluation pour <strong>${cleanFreelancerName}</strong> a bien été reçue.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin:18px 0">
              <p style="font-size:26px;color:#c02525;margin:0;text-align:center;letter-spacing:2px">${cleanStars}</p>
              <p style="font-size:18px;font-weight:800;text-align:center;color:#2A4DEF;margin:8px 0">${parseInt(note)}/5</p>
              ${commentaire ? `<p style="color:#334155;margin:0;font-style:italic">"${cleanComment}"</p>` : ''}
            </div>
          `,
          ctaLabel: 'Voir mes missions',
          ctaUrl: `${process.env.FRONTEND_URL}/employer/mes-missions`
        })
      });
    } catch (error) { console.error('Email recruteur évaluation:', error.message); }
  }

  try {
    await notificationService.createNotification(
      employerId,
      'evaluation',
      `Évaluation envoyée : ${note}/5`,
      `Votre évaluation pour ${freelancerName} a bien été enregistrée.`,
      { evaluation_id: evaluationId, freelancer_id: freelancerId, note, lien: '/employer/mes-missions' }
    );
  } catch (error) { console.error('Notification recruteur évaluation:', error.message); }

  try {
    await sendEmail({
      to: getAdminEmails(),
      subject: `[Admin] Nouvelle évaluation après mission — ${freelancerName}`,
      html: emailShell({
        title: 'Nouvelle évaluation après mission',
        children: `
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><b>Prestataire</b></td><td>${cleanFreelancerName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><b>Recruteur</b></td><td>${cleanEmployerName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><b>Note</b></td><td>${parseInt(note)}/5 ${cleanStars}</td></tr>
            <tr><td style="padding:8px"><b>Commentaire</b></td><td>${cleanComment || 'Aucun commentaire'}</td></tr>
          </table>
        `,
        ctaLabel: 'Voir les utilisateurs',
        ctaUrl: `${process.env.FRONTEND_URL}/admin/users`
      })
    });
  } catch (error) { console.error('Email admin évaluation:', error.message); }

  try {
    await notifyAdmins(
      'evaluation',
      `Nouvelle évaluation : ${note}/5`,
      `${employerName} a évalué ${freelancerName}.`,
      { evaluation_id: evaluationId, freelancer_id: freelancerId, employer_id: employerId, note, lien: '/admin/users' }
    );
  } catch (error) { console.error('Notification admin évaluation:', error.message); }
};

// Créer une évaluation
exports.createEvaluation = async (req, res, next) => {
  try {
    const employer_id = req.user.id;
    const {
      mission_id,
      mission_type,
      freelancer_id,
      note,
      commentaire,
      qualite_travail,
      respect_delais,
      communication,
      recommandation
    } = req.body;

    const mId = mission_id ? parseInt(mission_id) : null;
    const mType = mission_type || null;

    // Vérifier si une évaluation existe déjà pour cette mission
    if (mId) {
      const [existing] = await db.query(
        `SELECT id FROM evaluations 
         WHERE mission_id = ? AND employer_id = ? AND freelancer_id = ?`,
        [mId, employer_id, freelancer_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà évalué ce freelancer pour cette mission'
        });
      }
    }

    // Créer l'évaluation
    const [result] = await db.query(
      `INSERT INTO evaluations 
       (mission_id, mission_type, employer_id, freelancer_id, note, commentaire, 
        qualite_travail, respect_delais, communication, recommandation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mId, mType, employer_id, freelancer_id, note, commentaire || '',
       qualite_travail || note, respect_delais || note, communication || note, recommandation !== undefined ? recommandation : true]
    );

    // Récupérer les infos du freelancer et de l'employeur
    const [freelancer] = await db.query(
      'SELECT prenom, nom, email FROM users WHERE id = ?',
      [freelancer_id]
    );

    const [employer] = await db.query(
      'SELECT id, denomination, nom, prenom, email FROM users WHERE id = ?',
      [employer_id]
    );

    // Envoyer un email au freelancer
    if (freelancer.length > 0 && employer.length > 0) {
      const freelancerName = `${freelancer[0].prenom} ${freelancer[0].nom}`;
      const employerName = employer[0].denomination || 
                          `${employer[0].prenom} ${employer[0].nom}`;

      // Envoyer l'email et les notifications en arrière-plan sans bloquer la réponse HTTP
      sendEmail({
        to: freelancer[0].email,
        subject: 'Vous avez reçu une nouvelle évaluation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2A4DEF;">⭐ Nouvelle évaluation reçue</h2>
            <p>Bonjour ${freelancerName},</p>
            <p><strong>${employerName}</strong> a évalué votre travail avec une note de <strong>${note}/5 étoiles</strong>.</p>
            
            <div style="background: linear-gradient(135deg, #2A4DEF 0%, #4962D5 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <div style="font-size: 48px; color: #FFD700; margin-bottom: 10px;">
                ${'⭐'.repeat(Math.round(note))}
              </div>
              <p style="color: white; font-size: 24px; font-weight: bold; margin: 0;">${note}/5</p>
            </div>
            
            ${commentaire ? `
              <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2A4DEF;">
                <p style="font-weight: bold; color: #2A4DEF; margin-bottom: 5px;">Commentaire :</p>
                <p style="margin: 0; color: #4B5563; font-style: italic;">"${commentaire}"</p>
              </div>
            ` : ''}
            
            <div style="background: #eef3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #2A4DEF; font-size: 14px;">
                📊 <strong>Détails :</strong><br>
                Qualité du travail : ${qualite_travail}/5<br>
                Respect des délais : ${respect_delais}/5<br>
                Communication : ${communication}/5<br>
                ${recommandation ? '✅ Vous recommande à d’autres clients' : ''}
              </p>
            </div>
            
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/freelancer/evaluations" 
                 style="background: #2A4DEF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir toutes mes évaluations
              </a>
            </p>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              Les évaluations positives améliorent votre visibilité sur la plateforme !<br><br>
              L'équipe Indebel
            </p>
          </div>
        `
      }).catch(err => console.error('❌ Erreur email evaluation:', err.message));

      notificationService.createNotification(
        freelancer_id,
        'evaluation',
        `⭐ Nouvelle évaluation : ${note}/5`,
        `${employerName} vous a évalué avec ${note}/5 étoiles. ${commentaire ? 'Commentaire laissé.' : ''}`,
        {
          evaluation_id: result.insertId,
          note: note,
          employer_name: employerName,
          lien: '/freelancer/evaluations'
        }
      ).catch(err => console.error('❌ Erreur notif evaluation:', err.message));

      sendEvaluationFollowUps({
        evaluationId: result.insertId,
        note,
        commentaire,
        freelancerId: freelancer_id,
        freelancerName,
        employerId: employer_id,
        employerEmail: employer[0].email,
        employerName
      }).catch(err => console.error('❌ Erreur followups evaluation:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Évaluation créée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les évaluations d'un freelancer
exports.getFreelancerEvaluations = async (req, res, next) => {
  try {
    const { freelancer_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [evaluations] = await db.query(
      `SELECT 
        e.*,
        u.denomination as employer_denomination,
        u.nom as employer_nom,
        u.prenom as employer_prenom,
        u.photo_profil as employer_photo
       FROM evaluations e
       JOIN users u ON e.employer_id = u.id
       WHERE e.freelancer_id = ?
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [freelancer_id, parseInt(limit), parseInt(offset)]
    );

    // Calculer les statistiques
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_evaluations,
        AVG(note) as note_moyenne,
        AVG(qualite_travail) as qualite_moyenne,
        AVG(respect_delais) as delais_moyen,
        AVG(communication) as communication_moyenne,
        SUM(CASE WHEN recommandation = 1 THEN 1 ELSE 0 END) as total_recommandations
       FROM evaluations
       WHERE freelancer_id = ?`,
      [freelancer_id]
    );

    // Distribution des notes
    const [distribution] = await db.query(
      `SELECT 
        note,
        COUNT(*) as count
       FROM evaluations
       WHERE freelancer_id = ?
       GROUP BY note
       ORDER BY note DESC`,
      [freelancer_id]
    );

    const [totalCount] = await db.query(
      'SELECT COUNT(*) as total FROM evaluations WHERE freelancer_id = ?',
      [freelancer_id]
    );

    res.json({
      success: true,
      data: {
        evaluations,
        stats: stats[0],
        distribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].total,
          pages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer les évaluations données par un employeur
exports.getEmployerEvaluations = async (req, res, next) => {
  try {
    const employer_id = req.user.id;

    const [evaluations] = await db.query(
      `SELECT 
        e.*,
        u.prenom as freelancer_prenom,
        u.nom as freelancer_nom,
        u.photo_profil as freelancer_photo
       FROM evaluations e
       JOIN users u ON e.freelancer_id = u.id
       WHERE e.employer_id = ?
       ORDER BY e.created_at DESC`,
      [employer_id]
    );

    res.json({
      success: true,
      data: evaluations
    });
  } catch (error) {
    next(error);
  }
};

// Marquer une mission comme terminée pour un freelancer (avec ou sans évaluation)
exports.terminerMissionFreelancer = async (req, res, next) => {
  try {
    const employer_id = req.user.id;
    const { demande_id, avec_evaluation, evaluation } = req.body;

    // Récupérer la demande
    const [demandes] = await db.query(
      `SELECT * FROM demandes_missions WHERE id = ? AND employer_id = ?`,
      [demande_id, employer_id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    const demande = demandes[0];

    // Marquer la demande comme terminée
    await db.query(
      `UPDATE demandes_missions SET statut = 'terminee' WHERE id = ?`,
      [demande_id]
    );

    // Si évaluation fournie, la créer
    if (avec_evaluation && evaluation) {
      const [evalResult] = await db.query(
        `INSERT INTO evaluations 
         (mission_id, mission_type, employer_id, freelancer_id, note, commentaire, 
          qualite_travail, respect_delais, communication, recommandation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          demande.mission_id,
          demande.mission_type,
          employer_id,
          demande.freelancer_id,
          evaluation.note,
          evaluation.commentaire,
          evaluation.qualite_travail,
          evaluation.respect_delais,
          evaluation.communication,
          evaluation.recommandation
        ]
      );

      // Récupérer les infos du freelancer et de l'employeur
      const [freelancer] = await db.query(
        'SELECT prenom, nom, email FROM users WHERE id = ?',
        [demande.freelancer_id]
      );

      const [employer] = await db.query(
        'SELECT id, denomination, nom, prenom, email FROM users WHERE id = ?',
        [employer_id]
      );

      if (freelancer.length > 0 && employer.length > 0) {
        const freelancerName = `${freelancer[0].prenom} ${freelancer[0].nom}`;
        const employerName = employer[0].denomination || 
                            `${employer[0].prenom} ${employer[0].nom}`;

        // Envoyer l'email
        try {
          await sendEmail({
            to: freelancer[0].email,
            subject: 'Vous avez reçu une nouvelle évaluation',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2A4DEF;">⭐ Nouvelle évaluation reçue</h2>
                <p>Bonjour ${freelancerName},</p>
                <p><strong>${employerName}</strong> a évalué votre travail avec une note de <strong>${evaluation.note}/5 étoiles</strong>.</p>
                
                <div style="background: linear-gradient(135deg, #2A4DEF 0%, #4962D5 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                  <div style="font-size: 48px; color: #FFD700; margin-bottom: 10px;">
                    ${'⭐'.repeat(Math.round(evaluation.note))}
                  </div>
                  <p style="color: white; font-size: 24px; font-weight: bold; margin: 0;">${evaluation.note}/5</p>
                </div>
                
                ${evaluation.commentaire ? `
                  <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2A4DEF;">
                    <p style="font-weight: bold; color: #2A4DEF; margin-bottom: 5px;">Commentaire :</p>
                    <p style="margin: 0; color: #4B5563; font-style: italic;">"${evaluation.commentaire}"</p>
                  </div>
                ` : ''}
                
                <div style="background: #eef3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #2A4DEF; font-size: 14px;">
                    📊 <strong>Détails :</strong><br>
                    Qualité du travail : ${evaluation.qualite_travail}/5<br>
                    Respect des délais : ${evaluation.respect_delais}/5<br>
                    Communication : ${evaluation.communication}/5<br>
                    ${evaluation.recommandation ? '✅ Vous recommande à d’autres clients' : ''}
                  </p>
                </div>
                
                <p style="margin-top: 20px;">
                  <a href="${process.env.FRONTEND_URL}/freelancer/evaluations" 
                     style="background: #2A4DEF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir toutes mes évaluations
                  </a>
                </p>
                
                <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                  Les évaluations positives améliorent votre visibilité sur la plateforme !<br><br>
                  L'équipe Indebel
                </p>
              </div>
            `
          });
          console.log(`✅ Email d'évaluation envoyé à ${freelancerName}`);
        } catch (emailError) {
          console.error('❌ Erreur envoi email évaluation:', emailError.message);
        }

        // Créer une notification
        try {
          await notificationService.createNotification(
            demande.freelancer_id,
            'evaluation',
            `⭐ Nouvelle évaluation : ${evaluation.note}/5`,
            `${employerName} vous a évalué avec ${evaluation.note}/5 étoiles. ${evaluation.commentaire ? 'Commentaire laissé.' : ''}`,
            {
              evaluation_id: evalResult.insertId,
              note: evaluation.note,
              employer_name: employerName,
              lien: '/freelancer/evaluations'
            }
          );
          console.log(`✅ Notification d'évaluation créée pour ${freelancerName}`);
        } catch (notifError) {
          console.error('❌ Erreur création notification:', notifError.message);
        }

        await sendEvaluationFollowUps({
          evaluationId: evalResult.insertId,
          note: evaluation.note,
          commentaire: evaluation.commentaire,
          freelancerId: demande.freelancer_id,
          freelancerName,
          employerId: employer_id,
          employerEmail: employer[0].email,
          employerName
        });
      }
    }

    res.json({
      success: true,
      message: 'Mission terminée pour ce freelancer'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminEvaluations = async (req, res, next) => {
  try {
    const { search = '', limit = 1000 } = req.query;
    
    let query = `
      SELECT e.*, 
        u_free.prenom as freelancer_prenom, u_free.nom as freelancer_nom,
        u_emp.denomination as employer_denomination, u_emp.prenom as employer_prenom, u_emp.nom as employer_nom
      FROM evaluations e
      JOIN users u_free ON e.freelancer_id = u_free.id
      JOIN users u_emp ON e.employer_id = u_emp.id
    `;
    
    const params = [];
    
    if (search) {
      query += ` WHERE e.commentaire LIKE ? OR u_free.prenom LIKE ? OR u_free.nom LIKE ? OR u_emp.denomination LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    query += ` ORDER BY e.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [evaluations] = await db.query(query, params);
    
    res.json({ success: true, data: evaluations });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, commentaire, qualite_travail, respect_delais, communication } = req.body;
    
    await db.query(
      `UPDATE evaluations SET note = ?, commentaire = ?, qualite_travail = ?, respect_delais = ?, communication = ? WHERE id = ?`,
      [note, commentaire, qualite_travail, respect_delais, communication, id]
    );
    
    res.json({ success: true, message: 'Évaluation mise à jour' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAdminEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM evaluations WHERE id = ?', [id]);
    res.json({ success: true, message: 'Évaluation supprimée' });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
