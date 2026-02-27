const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('../services/notificationService');

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

    // Vérifier que l'employeur n'a pas déjà évalué ce freelancer pour cette mission
    const [existing] = await db.query(
      `SELECT id FROM evaluations 
       WHERE mission_id = ? AND mission_type = ? AND employer_id = ? AND freelancer_id = ?`,
      [mission_id, mission_type, employer_id, freelancer_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà évalué ce freelancer pour cette mission'
      });
    }

    // Créer l'évaluation
    const [result] = await db.query(
      `INSERT INTO evaluations 
       (mission_id, mission_type, employer_id, freelancer_id, note, commentaire, 
        qualite_travail, respect_delais, communication, recommandation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mission_id, mission_type, employer_id, freelancer_id, note, commentaire,
       qualite_travail, respect_delais, communication, recommandation]
    );

    // Récupérer les infos du freelancer et de l'employeur
    const [freelancer] = await db.query(
      'SELECT prenom, nom, email FROM users WHERE id = ?',
      [freelancer_id]
    );

    const [employer] = await db.query(
      'SELECT denomination, nom, prenom FROM users WHERE id = ?',
      [employer_id]
    );

    // Envoyer un email au freelancer
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
              <h2 style="color: #4F46E5;">⭐ Nouvelle évaluation reçue</h2>
              <p>Bonjour ${freelancerName},</p>
              <p><strong>${employerName}</strong> a évalué votre travail avec une note de <strong>${note}/5 étoiles</strong>.</p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <div style="font-size: 48px; color: #FFD700; margin-bottom: 10px;">
                  ${'⭐'.repeat(Math.round(note))}
                </div>
                <p style="color: white; font-size: 24px; font-weight: bold; margin: 0;">${note}/5</p>
              </div>
              
              ${commentaire ? `
                <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                  <p style="font-weight: bold; color: #4F46E5; margin-bottom: 5px;">Commentaire :</p>
                  <p style="margin: 0; color: #4B5563; font-style: italic;">"${commentaire}"</p>
                </div>
              ` : ''}
              
              <div style="background: #EEF2FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #4338CA; font-size: 14px;">
                  📊 <strong>Détails :</strong><br>
                  Qualité du travail : ${qualite_travail}/5<br>
                  Respect des délais : ${respect_delais}/5<br>
                  Communication : ${communication}/5<br>
                  ${recommandation ? '✅ Vous recommande à d’autres clients' : ''}
                </p>
              </div>
              
              <p style="margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL}/freelancer/evaluations" 
                   style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
          freelancer_id,
          'evaluation',
          `⭐ Nouvelle évaluation : ${note}/5`,
          `${employerName} vous a évalué avec ${note}/5 étoiles. ${commentaire ? 'Commentaire laissé.' : ''}`,
          {
            evaluation_id: result.insertId,
            note: note,
            employer_name: employerName
          }
        );
        console.log(`✅ Notification d'évaluation créée pour ${freelancerName}`);
      } catch (notifError) {
        console.error('❌ Erreur création notification:', notifError.message);
      }
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
        'SELECT denomination, nom, prenom FROM users WHERE id = ?',
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
                <h2 style="color: #4F46E5;">⭐ Nouvelle évaluation reçue</h2>
                <p>Bonjour ${freelancerName},</p>
                <p><strong>${employerName}</strong> a évalué votre travail avec une note de <strong>${evaluation.note}/5 étoiles</strong>.</p>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                  <div style="font-size: 48px; color: #FFD700; margin-bottom: 10px;">
                    ${'⭐'.repeat(Math.round(evaluation.note))}
                  </div>
                  <p style="color: white; font-size: 24px; font-weight: bold; margin: 0;">${evaluation.note}/5</p>
                </div>
                
                ${evaluation.commentaire ? `
                  <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                    <p style="font-weight: bold; color: #4F46E5; margin-bottom: 5px;">Commentaire :</p>
                    <p style="margin: 0; color: #4B5563; font-style: italic;">"${evaluation.commentaire}"</p>
                  </div>
                ` : ''}
                
                <div style="background: #EEF2FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #4338CA; font-size: 14px;">
                    📊 <strong>Détails :</strong><br>
                    Qualité du travail : ${evaluation.qualite_travail}/5<br>
                    Respect des délais : ${evaluation.respect_delais}/5<br>
                    Communication : ${evaluation.communication}/5<br>
                    ${evaluation.recommandation ? '✅ Vous recommande à d’autres clients' : ''}
                  </p>
                </div>
                
                <p style="margin-top: 20px;">
                  <a href="${process.env.FRONTEND_URL}/freelancer/evaluations" 
                     style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
              employer_name: employerName
            }
          );
          console.log(`✅ Notification d'évaluation créée pour ${freelancerName}`);
        } catch (notifError) {
          console.error('❌ Erreur création notification:', notifError.message);
        }
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

module.exports = exports;
