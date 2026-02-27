const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');
const path = require('path');
const fs = require('fs');

// Vérifier si un utilisateur remplit les critères pour le label
exports.verifierCriteres = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Récupérer les informations de l'utilisateur
    const [users] = await db.query(
      `SELECT u.*, f.nom as forfait_nom, f.type_utilisateur as forfait_type
       FROM users u
       LEFT JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Critère 1: Utilisateur actif (compte non supprimé)
    const estActif = true; // Si on récupère l'utilisateur, il est actif

    // Critère 2: Profil complété à 100%
    const champsRequis = [
      'nom', 'prenom', 'email', 'telephone', 'adresse',
      'pays_code', 'secteur', 'competences'
    ];

    let champsRemplis = 0;
    champsRequis.forEach(champ => {
      if (user[champ] && user[champ] !== null && user[champ] !== '') {
        champsRemplis++;
      }
    });

    const profilComplete = (champsRemplis / champsRequis.length) * 100;
    const profilCompleteBool = profilComplete >= 100;

    // Critère 3: Forfait Premium ou Business (pas gratuit)
    const forfaitValide = user.forfait_id &&
      user.forfait_nom &&
      (user.forfait_nom.includes('Premium') || user.forfait_nom.includes('Business'));

    // Critère 4: Au moins 3 évaluations positives (pour freelancer)
    let evaluationsCount = 0;
    let evaluationsValides = false;

    if (user.role === 'freelancer') {
      const [evaluations] = await db.query(
        `SELECT COUNT(*) as count 
         FROM evaluations 
         WHERE freelancer_id = ? AND note >= 4`,
        [userId]
      );
      evaluationsCount = evaluations[0].count;
      evaluationsValides = evaluationsCount >= 3;
    } else {
      // Pour employer, pas besoin d'évaluations
      evaluationsValides = true;
    }

    const criteresRemplis = estActif && profilCompleteBool && forfaitValide && evaluationsValides;

    // Note: Ne pas enregistrer dans label_verifications car cette table est pour la vérification d'identité
    // Les critères sont retournés directement au frontend

    res.json({
      success: true,
      data: {
        eligible: criteresRemplis,
        criteresRemplis,
        pourcentageProfile: profilComplete.toFixed(1),
        details: {
          compteActif: estActif,
          profilComplete: profilCompleteBool,
          forfaitValide: forfaitValide,
          profilCompletion: profilComplete,
          forfaitNom: user.forfait_nom,
          evaluationsCount,
          evaluationsValides,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Erreur vérification critères:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des critères'
    });
  }
};

// Demander le label (automatique ou manuel par admin)
exports.demanderLabel = async (req, res) => {
  try {
    const { userId, demandeParAdmin = false } = req.body;
    const targetUserId = userId || req.user.id;
    const adminId = demandeParAdmin ? req.user.id : null;

    // Vérifier si l'utilisateur a déjà un label
    const [existing] = await db.query(
      'SELECT * FROM label_indebel WHERE user_id = ?',
      [targetUserId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: existing[0].statut === 'accepte'
          ? 'Cet utilisateur possède déjà le label Indebel'
          : 'Une demande de label est déjà en attente pour cet utilisateur'
      });
    }

    // Vérifier les critères directement
    // Récupérer les informations de l'utilisateur
    const [users] = await db.query(
      `SELECT u.*, f.nom as forfait_nom, f.type_utilisateur as forfait_type
       FROM users u
       LEFT JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ?`,
      [targetUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userToCheck = users[0];

    // Critère 1: Utilisateur actif
    const estActif = true;

    // Critère 2: Profil complété
    const champsRequis = ['nom', 'prenom', 'email', 'telephone', 'adresse', 'pays_code', 'secteur', 'competences'];
    let champsRemplis = 0;
    champsRequis.forEach(champ => {
      if (userToCheck[champ] && userToCheck[champ] !== null && userToCheck[champ] !== '') {
        champsRemplis++;
      }
    });
    const profilComplete = (champsRemplis / champsRequis.length) * 100;
    const profilCompleteBool = profilComplete >= 100;

    // Critère 3: Forfait Premium ou Business (pas gratuit)
    const forfaitValide = userToCheck.forfait_id &&
      userToCheck.forfait_nom &&
      (userToCheck.forfait_nom.includes('Premium') || userToCheck.forfait_nom.includes('Business'));

    const criteresRemplis = estActif && profilCompleteBool && forfaitValide;
    const details = {
      compteActif: estActif,
      profilComplete: profilCompleteBool,
      forfaitValide: forfaitValide
    };

    // Utiliser les données déjà récupérées
    const user = userToCheck;

    // Gérer les demandes exceptionnelles (non éligibles)
    if (!criteresRemplis && !req.body.demandeParAdmin) {
      // Demande exceptionnelle - toujours créer la demande mais avec un statut spécial
      const result = await db.query(
        `INSERT INTO label_indebel (user_id, admin_id, statut, date_demande, demande_par, criteres_remplis, commentaire)
         VALUES (?, ?, 'en_attente_exceptionnel', NOW(), 'user', ?, 'Demande exceptionnelle - critères non remplis')`,
        [targetUserId, adminId, false]
      );

      // Notifier tous les admins de la demande exceptionnelle
      await db.query(
        `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
         SELECT id, 'warning', 'Demande de Label Exceptionnelle', 
                'L\\'utilisateur ${user.prenom || user.nom} (${user.email}) a fait une demande exceptionnelle de Label Indebel malgré des critères non remplis.', 
                '/admin/label', NOW()
         FROM users WHERE role = 'admin'`
      );

      // Notification pour l'utilisateur
      await db.query(
        `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
         VALUES (?, 'info', 'Demande exceptionnelle envoyée', 'Votre demande exceptionnelle de Label Indebel a été transmise aux administrateurs pour examen.', '/freelancer/label', NOW())`,
        [targetUserId]
      );

      return res.json({
        success: true,
        message: 'Demande exceptionnelle envoyée aux administrateurs',
        data: {
          labelId: result.insertId,
          criteresRemplis: false,
          demandeExceptionnelle: true
        }
      });
    }

    // Si pas éligible et pas de demande par admin, refuser
    if (!criteresRemplis) {
      return res.status(400).json({
        success: false,
        message: 'Vous n\'êtes pas éligible pour le Label Indebel',
        data: { criteresRemplis: false }
      });
    }

    // Si l'utilisateur est éligible, créer la demande normale
    const result = await db.query(
      `INSERT INTO label_indebel (user_id, admin_id, statut, date_demande, demande_par, criteres_remplis)
       VALUES (?, ?, 'en_attente', NOW(), ?, ?)`,
      [
        targetUserId,
        adminId,
        req.body.demandeParAdmin ? 'admin' : 'user',
        criteresRemplis
      ]
    );


    // Envoyer l'email à l'utilisateur s'il est éligible
    if (criteresRemplis && user) {
      const emailConfig = {
        to: user.email,
        subject: '🏆 Vous êtes éligible au Label Indebel !',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🏆 Label Indebel</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Invitation à rejoindre notre programme d'excellence</p>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Bonjour ${user.prenom || user.nom},</h2>
              <p style="color: #666; line-height: 1.6;">Félicitations ! Après analyse de votre profil, nous avons le plaisir de vous informer que vous êtes <strong>éligible pour recevoir le Label Indebel</strong>.</p>
              
              <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #667eea;">Qu'est-ce que le Label Indebel ?</h3>
                <p style="margin: 0; color: #666;">Ce label certifie votre professionnalisme, votre engagement et la qualité de vos services sur notre plateforme. Il vous permettra de vous démarquer auprès des clients.</p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                <strong>Prochaines étapes :</strong><br>
                1. Connectez-vous à votre compte Indebel<br>
                2. Consultez votre demande de label en attente<br>
                3. Acceptez ou refusez cette distinction
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" 
                   style="background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Accéder à mon compte
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                Cordialement,<br>
                <strong>L'équipe Indebel</strong>
              </p>
            </div>
          </div>
        `
      };
      await sendEmail(emailConfig);

      // Créer notification pour l'utilisateur
      await db.query(
        `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
         VALUES (?, 'label', 'Label Indebel disponible', 'Vous êtes éligible pour recevoir le Label Indebel. Consultez votre demande.', '/freelancer/profile', NOW())`,
        [userId]
      );

      // Notifier l'admin qu'un utilisateur est éligible
      if (req.body.demandeParAdmin) {
        await db.query(
          `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
           VALUES (?, 'info', 'Utilisateur éligible au Label', 'L\\'utilisateur ${user.prenom || user.nom} (${user.email}) est éligible pour le Label Indebel.', '/admin/label', NOW())`,
          [req.user.id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Demande de label créée avec succès',
      data: {
        labelId: result.insertId,
        criteresRemplis
      }
    });

  } catch (error) {
    console.error('Erreur demande label:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de label'
    });
  }
};

// Répondre à une demande de label (accepter/refuser)
exports.repondreLabel = async (req, res) => {
  try {
    const { labelId, accepte } = req.body;
    const userId = req.user.id;

    const [labels] = await db.query(
      'SELECT * FROM label_indebel WHERE id = ? AND user_id = ?',
      [labelId, userId]
    );

    if (labels.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande de label non trouvée'
      });
    }

    const label = labels[0];

    if (label.statut !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    await db.query(
      `UPDATE label_indebel 
       SET statut = ?, date_reponse = NOW(), date_attribution = ?
       WHERE id = ?`,
      [
        accepte ? 'accepte' : 'refuse',
        accepte ? new Date() : null,
        labelId
      ]
    );

    // Récupérer les informations de l'utilisateur pour l'email
    const [users] = await db.query(
      'SELECT nom, prenom, email FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];

    // Si accepté, envoyer email de confirmation avec le nouveau template
    if (accepte && user) {
      try {
        const emailConfig = emailTemplates.labelApproved(user.prenom, user.nom, user.email);
        await sendEmail(emailConfig);
        console.log('✅ Email d\'approbation envoyé à:', user.email);
      } catch (emailError) {
        console.error('❌ Erreur envoi email label approuvé:', emailError);
      }

      // Créer notification pour l'utilisateur
      await db.query(
        `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
         VALUES (?, 'success', 'Label Indebel confirmé !', 'Félicitations ! Votre Label Indebel est maintenant actif sur votre profil.', '/freelancer/profile', NOW())`,
        [userId]
      );
    }

    // Si refusé, envoyer email de refus
    if (!accepte && user) {
      try {
        const emailConfig = emailTemplates.labelRejected(user.prenom, user.nom, user.email, 'Votre demande ne remplit pas les critères actuels.');
        await sendEmail(emailConfig);
        console.log('✅ Email de refus envoyé à:', user.email);
      } catch (emailError) {
        console.error('❌ Erreur envoi email label refusé:', emailError);
      }

      // Créer notification pour l'utilisateur
      await db.query(
        `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
         VALUES (?, 'info', 'Demande de label examinée', 'Votre demande de Label Indebel a été examinée. Continuez à améliorer votre profil pour être éligible.', '/freelancer/label/eligibility', NOW())`,
        [userId]
      );
    }

    // Notifier tous les admins de la réponse
    await db.query(
      `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
       SELECT id, 'info', 'Réponse au Label Indebel', 
              'L\'utilisateur ${user.prenom || user.nom} a ${accepte ? 'accepté' : 'refusé'} son Label Indebel.', 
              '/admin/label', NOW()
       FROM users WHERE role = 'admin'`
    );

    res.json({
      success: true,
      message: accepte
        ? 'Label Indebel accepté ! Il apparaîtra maintenant sur votre profil.'
        : 'Demande de label refusée'
    });

  } catch (error) {
    console.error('Erreur réponse label:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réponse au label'
    });
  }
};

// Obtenir le statut du label d'un utilisateur
exports.getStatutLabel = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // 1. Vérifier la table standard label_indebel
    const [standardLabels] = await db.query(
      `SELECT l.*, u.nom, u.prenom, u.email, a.nom as admin_nom, a.prenom as admin_prenom
       FROM label_indebel l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN users a ON l.admin_id = a.id
       WHERE l.user_id = ?`,
      [userId]
    );

    // 2. Vérifier la table exceptionnelle/admin labels
    const [exceptionalLabels] = await db.query(
      `SELECT l.*, 'exceptional' as source, l.statut as statut_label
       FROM labels l
       WHERE l.user_id = ? AND l.statut = 'actif'`,
      [userId]
    );

    let hasLabel = false;
    let labelData = null;
    let statut = null;

    // Priorité au label actif exceptionnel s'il existe
    if (exceptionalLabels.length > 0) {
      hasLabel = true;
      statut = 'accepte';
      labelData = exceptionalLabels[0];
      // Adapter le format pour le frontend
      labelData.statut = 'accepte';
      labelData.date_attribution = exceptionalLabels[0].date_attribution;
    }
    // Sinon vérifier le label standard
    else if (standardLabels.length > 0) {
      labelData = standardLabels[0];
      statut = labelData.statut;
      hasLabel = statut === 'accepte';
    }

    res.json({
      success: true,
      data: {
        hasLabel,
        statut,
        label: labelData
      }
    });

  } catch (error) {
    console.error('Erreur get statut label:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
};

// Lister tous les utilisateurs avec label (admin)
exports.getUsersAvecLabel = async (req, res) => {
  try {
    const { statut } = req.query;

    let query = `
      SELECT l.*, u.id as user_id, u.nom, u.prenom, u.email, u.role, u.telephone,
             a.nom as admin_nom, a.prenom as admin_prenom
      FROM label_indebel l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.admin_id = a.id
    `;

    const params = [];

    if (statut) {
      query += ' WHERE l.statut = ?';
      params.push(statut);
    }

    query += ' ORDER BY l.date_demande DESC';

    const [labels] = await db.query(query, params);

    res.json({
      success: true,
      data: labels
    });

  } catch (error) {
    console.error('Erreur get users avec label:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs avec label'
    });
  }
};

// Révoquer un label (admin)
exports.revoquerLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    const { raison } = req.body;

    await db.query(
      `UPDATE label_indebel 
       SET statut = 'refuse', notes_admin = ?, date_reponse = NOW()
       WHERE id = ?`,
      [raison || 'Label révoqué par un administrateur', labelId]
    );

    res.json({
      success: true,
      message: 'Label révoqué avec succès'
    });

  } catch (error) {
    console.error('Erreur révocation label:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la révocation du label'
    });
  }
};

// Obtenir la demande en attente pour l'utilisateur connecté
exports.getDemandeEnAttente = async (req, res) => {
  try {
    const userId = req.user.id;

    const [labels] = await db.query(
      `SELECT * FROM label_indebel 
       WHERE user_id = ? AND statut = 'en_attente'
       ORDER BY date_demande DESC
       LIMIT 1`,
      [userId]
    );

    if (labels.length === 0) {
      return res.json({
        success: true,
        data: {
          hasDemandeEnAttente: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasDemandeEnAttente: true,
        demande: labels[0]
      }
    });

  } catch (error) {
    console.error('Erreur get demande en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la demande'
    });
  }
};

// Soumettre une demande exceptionnelle de label
exports.submitExceptionalRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      reason,
      description,
      experience_years,
      portfolio_links,
      special_skills,
      references,
      additional_info
    } = req.body;

    // Gérer les fichiers uploadés
    const files = req.files || [];
    const fileNames = files.map(file => file.filename);

    // Combiner additional_info avec les fichiers
    let finalAdditionalInfo = additional_info || '';
    if (fileNames.length > 0) {
      const filesInfo = `\n\nFichiers attachés: ${fileNames.join(', ')}`;
      finalAdditionalInfo += filesInfo;
    }

    // Vérifier si l'utilisateur a déjà une demande en cours
    const [existing] = await db.query(
      'SELECT * FROM label_exceptional_requests WHERE user_id = ? AND statut IN ("pending", "under_review")',
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà une demande exceptionnelle en cours'
      });
    }

    // Récupérer les informations de l'utilisateur
    const [users] = await db.query(
      'SELECT nom, prenom, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Combiner toutes les informations en une justification complète
    let justificationComplete = `**Raison:** ${reason}\n\n`;
    justificationComplete += `**Description:** ${description}\n\n`;
    if (experience_years) justificationComplete += `**Années d'expérience:** ${experience_years}\n\n`;
    if (portfolio_links) justificationComplete += `**Portfolio/Liens:** ${portfolio_links}\n\n`;
    if (special_skills) justificationComplete += `**Compétences spéciales:** ${special_skills}\n\n`;
    if (references) justificationComplete += `**Références:** ${references}\n\n`;
    if (finalAdditionalInfo) justificationComplete += `**Informations supplémentaires:** ${finalAdditionalInfo}`;

    // Créer la demande exceptionnelle
    const [result] = await db.query(
      `INSERT INTO label_exceptional_requests 
       (user_id, justification, statut, created_at)
       VALUES (?, ?, 'pending', NOW())`,
      [userId, justificationComplete]
    );

    const requestId = result.insertId;

    // Notifier tous les admins
    await db.query(
      `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
       SELECT id, 'warning', 'Demande Label Exceptionnelle', 
              'L\\'utilisateur ${user.prenom || user.nom} (${user.email}) a soumis une demande exceptionnelle de Label Indebel.', 
              '/admin/label', NOW()
       FROM users WHERE role = 'admin'`
    );

    // Notification pour l'utilisateur
    await db.query(
      `INSERT INTO notifications (user_id, type, titre, message, lien, date_creation)
       VALUES (?, 'info', 'Demande exceptionnelle soumise', 'Votre demande exceptionnelle de Label Indebel a été transmise aux administrateurs pour examen.', '/freelancer/label/eligibility', NOW())`,
      [userId]
    );

    // Envoyer emails aux administrateurs
    try {
      const [admins] = await db.query('SELECT email, prenom, nom FROM users WHERE role = "admin"');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      for (const admin of admins) {
        await sendEmail(
          admin.email,
          '🔔 Nouvelle demande de Label Indebel exceptionnelle',
          `Bonjour ${admin.prenom || 'Admin'},\n\nUne nouvelle demande exceptionnelle de Label Indebel a été soumise par ${user.prenom} ${user.nom} (${user.email}).\n\nRaison: ${reason}\n\nVeuillez examiner cette demande dans l'interface d'administration.\n\nCordialement,\nSystème Indebel`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #f59e0b; margin: 0;">🔔 Nouvelle demande exceptionnelle</h1>
              </div>
              
              <p style="color: #333; line-height: 1.6; font-size: 16px;">
                Bonjour <strong>${admin.prenom || 'Admin'}</strong>,
              </p>
              
              <p style="color: #333; line-height: 1.6;">
                Une nouvelle demande exceptionnelle de <strong>Label Indebel</strong> a été soumise et nécessite votre attention.
              </p>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0ea5e9;">Détails de la demande :</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Candidat :</strong> ${user.prenom} ${user.nom}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Email :</strong> ${user.email}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Raison :</strong> ${reason}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              
              ${description ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Description :</h4>
                <p style="margin: 0; color: #666; font-style: italic;">${description}</p>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/admin/label/exceptional-requests" 
                   style="background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Examiner la demande
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
                <p>Système automatique Indebel<br>Ne pas répondre à cet email</p>
              </div>
            </div>
          </div>
          `
        );
      }
      console.log(`✅ Emails envoyés à ${admins.length} administrateur(s)`);
    } catch (emailError) {
      console.error('❌ Erreur envoi emails aux admins:', emailError);
    }

    res.json({
      success: true,
      message: 'Demande exceptionnelle soumise avec succès',
      data: {
        requestId,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Erreur demande exceptionnelle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission de la demande'
    });
  }
};

// Obtenir le statut de la demande exceptionnelle
exports.getExceptionalRequestStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await db.query(
      `SELECT * FROM label_exceptional_requests 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (requests.length === 0) {
      return res.json({
        success: true,
        request: null
      });
    }

    res.json({
      success: true,
      request: requests[0]
    });

  } catch (error) {
    console.error('Erreur get exceptional request status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
};

// Obtenir les données d'éligibilité pour l'utilisateur connecté
exports.getEligibility = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les informations de l'utilisateur
    const [users] = await db.query(
      `SELECT u.*, f.nom as forfait_nom
       FROM users u
       LEFT JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Statistiques pour les missions terminées (via la table jobs)
    const [missionStats] = await db.query(
      `SELECT COUNT(*) as missions_completed 
       FROM jobs j 
       JOIN applications a ON j.id = a.job_id 
       WHERE a.freelancer_id = ? AND a.statut = 'accepte' AND j.statut = 'ferme'`,
      [userId]
    );

    // Note moyenne des évaluations
    const [ratingStats] = await db.query(
      `SELECT AVG(note) as average_rating, COUNT(*) as total_evaluations 
       FROM evaluations 
       WHERE freelancer_id = ?`,
      [userId]
    );

    // Temps de réponse moyen (via la table jobs)
    const [responseStats] = await db.query(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, j.date_creation, a.date_creation)) as avg_response_time
       FROM jobs j 
       JOIN applications a ON j.id = a.job_id 
       WHERE a.freelancer_id = ? AND a.date_creation IS NOT NULL`,
      [userId]
    );

    // Ancienneté du compte en mois
    const accountCreationDate = new Date(user.date_creation || user.created_at);
    const now = new Date();
    const accountAgeMonths = Math.floor((now - accountCreationDate) / (1000 * 60 * 60 * 24 * 30));

    const stats = {
      missions_completed: missionStats[0].missions_completed || 0,
      average_rating: parseFloat(ratingStats[0].average_rating || 0).toFixed(1),
      total_evaluations: ratingStats[0].total_evaluations || 0,
      avg_response_time: parseFloat(responseStats[0].avg_response_time || 0).toFixed(1),
      account_age_months: accountAgeMonths
    };

    // Vérifier si l'utilisateur a un forfait avec accès au label ou un label exceptionnel
    let forfaitHasLabelAccess = false;
    let hasExceptionalLabel = false;

    if (user.forfait_nom) {
      forfaitHasLabelAccess = user.forfait_nom.includes('Premium') || user.forfait_nom.includes('Business');
    }

    // Vérifier également la table labels (pour les labels exceptionnels/manuels)
    const [exceptionalLabels] = await db.query(
      'SELECT id FROM labels WHERE user_id = ? AND statut = ?',
      [userId, 'actif']
    );
    if (exceptionalLabels.length > 0) {
      hasExceptionalLabel = true;
      forfaitHasLabelAccess = true; // On considère qu'il a accès s'il a déjà le label
    }

    // Vérification de l'éligibilité actuelle
    const eligibility = {
      verification_complete: user.statut_verification === 'verifie',
      missions_requirement_met: stats.missions_completed >= 5,
      rating_requirement_met: parseFloat(stats.average_rating) >= 4.5,
      response_time_ok: parseFloat(stats.avg_response_time) <= 2,
      account_age_ok: accountAgeMonths >= 3,
      forfait_has_label_access: forfaitHasLabelAccess
    };

    res.json({
      success: true,
      eligibility,
      stats
    });

  } catch (error) {
    console.error('Erreur get eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données d\'éligibilité'
    });
  }
};

// Obtenir la liste des utilisateurs éligibles (admin)
exports.getEligibleUsers = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs avec leurs informations
    const [users] = await db.query(`
      SELECT u.*, 
             l.id as label_id,
             l.statut as label_statut,
             (CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END) as hasLabel
      FROM users u
      LEFT JOIN labels l ON u.id = l.user_id AND l.statut = 'actif'
      WHERE u.role IN ('freelancer', 'employer')
      ORDER BY u.date_creation DESC
    `);

    // Calculer l'éligibilité pour chaque utilisateur
    const eligibleUsers = [];
    let stats = { total: users.length, eligible: 0, hasLabel: 0, percentage: 0 };

    for (const user of users) {
      // Critères d'éligibilité basiques
      const profileComplete = !!(user.nom && user.prenom && user.email && user.telephone);
      const verified = user.statut_verification === 'verifie';
      const activeUser = true; // Si récupéré de la DB, alors actif

      // Simuler une note (devrait être calculée à partir des évaluations réelles)
      const goodRating = true; // Placeholder

      const criteria = {
        profileComplete,
        verified,
        activeUser,
        goodRating
      };

      // Score d'éligibilité
      const eligibilityScore = Math.round(
        ((profileComplete ? 1 : 0) +
          (verified ? 1 : 0) +
          (activeUser ? 1 : 0) +
          (goodRating ? 1 : 0)) / 4 * 100
      );

      // Considéré comme éligible si score >= 75%
      const isEligible = eligibilityScore >= 75;

      if (isEligible) {
        stats.eligible++;
        eligibleUsers.push({
          id: user.id,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          role: user.role,
          photo_profil: user.photo_profil,
          status_verification: user.statut_verification,
          hasLabel: user.hasLabel === 1,
          eligibilityScore,
          criteria
        });
      }

      if (user.hasLabel === 1) {
        stats.hasLabel++;
      }
    }

    stats.percentage = stats.total > 0 ? Math.round((stats.hasLabel / stats.total) * 100) : 0;

    res.json({
      success: true,
      data: {
        users: eligibleUsers,
        stats
      }
    });

  } catch (error) {
    console.error('Erreur get eligible users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs éligibles'
    });
  }
};

// Accorder un label à un utilisateur (admin)
exports.grantLabel = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Vérifier si l'utilisateur existe
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà un label actif
    const [existingLabels] = await db.query(
      'SELECT * FROM labels WHERE user_id = ? AND statut = ?',
      [userId, 'actif']
    );

    if (existingLabels.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur possède déjà un label actif'
      });
    }

    // Créer un nouveau label
    await db.query(
      `INSERT INTO labels (user_id, date_attribution, statut, attribue_par, type) 
       VALUES (?, NOW(), ?, ?, ?)`,
      [userId, 'actif', adminId, 'direct']
    );

    // Envoyer une notification à l'utilisateur
    const user = users[0];
    try {
      await sendEmail(
        user.email,
        emailTemplates.labelGranted.subject,
        emailTemplates.labelGranted.text
          .replace('{prenom}', user.prenom)
          .replace('{nom}', user.nom),
        emailTemplates.labelGranted.html
          .replace('{prenom}', user.prenom)
          .replace('{nom}', user.nom)
      );
    } catch (emailError) {
      console.error('Erreur envoi email label accordé:', emailError);
    }

    res.json({
      success: true,
      message: 'Label accordé avec succès'
    });

  } catch (error) {
    console.error('Erreur grant label:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'attribution du label'
    });
  }
};

// Retirer un label d'un utilisateur (admin)
exports.revokeUserLabel = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Vérifier si l'utilisateur a un label actif
    const [labels] = await db.query(
      'SELECT l.*, u.email, u.prenom, u.nom FROM labels l JOIN users u ON l.user_id = u.id WHERE l.user_id = ? AND l.statut = ?',
      [userId, 'actif']
    );

    if (labels.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun label actif trouvé pour cet utilisateur'
      });
    }

    const label = labels[0];

    // Désactiver le label
    await db.query(
      'UPDATE labels SET statut = ?, date_revocation = NOW(), revoque_par = ? WHERE id = ?',
      ['revoque', adminId, label.id]
    );

    // Envoyer une notification à l'utilisateur
    try {
      await sendEmail(
        label.email,
        emailTemplates.labelRevoked.subject,
        emailTemplates.labelRevoked.text
          .replace('{prenom}', label.prenom)
          .replace('{nom}', label.nom),
        emailTemplates.labelRevoked.html
          .replace('{prenom}', label.prenom)
          .replace('{nom}', label.nom)
      );
    } catch (emailError) {
      console.error('Erreur envoi email label retiré:', emailError);
    }

    res.json({
      success: true,
      message: 'Label retiré avec succès'
    });

  } catch (error) {
    console.error('Erreur revoke label:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du label'
    });
  }
};

// Obtenir les demandes exceptionnelles (admin)
exports.getExceptionalRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    let whereClause = '';
    let queryParams = [];

    if (status !== 'all') {
      whereClause = 'WHERE er.statut = ?';
      queryParams.push(status);
    }

    const [requests] = await db.query(`
      SELECT er.*, 
             u.prenom, u.nom, u.email, u.role, u.photo_profil, u.statut_verification
      FROM label_exceptional_requests er
      JOIN users u ON er.user_id = u.id
      ${whereClause}
      ORDER BY er.created_at DESC
    `, queryParams);

    // Calculer les statistiques
    const [statsResult] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN statut = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN statut = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM label_exceptional_requests
    `);

    const stats = {
      total: parseInt(statsResult[0].total) || 0,
      pending: parseInt(statsResult[0].pending) || 0,
      approved: parseInt(statsResult[0].approved) || 0,
      rejected: parseInt(statsResult[0].rejected) || 0
    };

    // Formater les demandes
    const formattedRequests = requests.map(request => {
      // Reconstitution des fichiers (si stockés ailleurs ou mockés)
      const files = [];
      // Extraction des infos depuis justification
      let justificationText = request.justification || '';
      let additionalInfo = '';

      if (justificationText.includes('**Informations supplémentaires:**')) {
        const parts = justificationText.split('**Informations supplémentaires:**');
        justificationText = parts[0];
        additionalInfo = parts[1];
      }

      if (additionalInfo && additionalInfo.includes('Fichiers attachés:')) {
        const parts = additionalInfo.split('Fichiers attachés:');
        if (parts.length > 1) {
          const fileList = parts[1].trim();
          // Simple parsing
          files.push({ name: fileList });
        }
      }

      return {
        id: request.id,
        user_id: request.user_id,
        status: request.statut,
        created_at: request.created_at,
        processed_at: request.processed_at,
        admin_response: request.admin_response,
        submitted_at: request.created_at,
        reason: justificationText, // On met tout dans reason pour l'instant
        description: '',
        experience_years: '',
        portfolio_links: '',
        special_skills: '',
        user_references: '',
        additional_info: additionalInfo,
        user: {
          id: request.user_id,
          prenom: request.prenom,
          nom: request.nom,
          email: request.email,
          role: request.role,
          photo_profil: request.photo_profil,
          status_verification: request.statut_verification
        },
        files: files
      };
    });

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        stats
      }
    });

  } catch (error) {
    console.error('Erreur get exceptional requests:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes exceptionnelles'
    });
  }
};

// Approuver une demande exceptionnelle (admin)
exports.approveExceptionalRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { requestId } = req.params;
    const { reason = '' } = req.body;
    const adminId = req.user.id;

    console.log(`[LabelAdmin] Début approbation demande ${requestId} par admin ${adminId}`);

    await connection.beginTransaction();

    // 1. Récupérer la demande
    const [requests] = await connection.query(`
      SELECT er.*, u.email, u.prenom, u.nom 
      FROM label_exceptional_requests er
      JOIN users u ON er.user_id = u.id
      WHERE er.id = ?
    `, [requestId]);

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    const request = requests[0];

    // Vérifier si déjà traitée
    if (request.statut !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cette demande a déjà été traitée (statut actuel: ${request.statut})`
      });
    }

    // 2. Approuver la demande
    await connection.query(
      'UPDATE label_exceptional_requests SET statut = ?, processed_at = NOW(), processed_by = ?, admin_response = ? WHERE id = ?',
      ['approved', adminId, reason, requestId]
    );

    // 3. Créer le label pour l'utilisateur
    await connection.query(
      'INSERT INTO labels (user_id, date_attribution, statut, attribue_par, type) VALUES (?, NOW(), ?, ?, ?)',
      [request.user_id, 'actif', adminId, 'exceptional']
    );

    await connection.commit();
    console.log(`[LabelAdmin] Demande ${requestId} approuvée avec succès`);

    // 4. Envoyer une notification à l'utilisateur (après commit)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      await sendEmail(
        request.email,
        '🎉 Votre demande de Label Indebel a été approuvée !',
        `Bonjour ${request.prenom},\n\nVotre demande exceptionnelle pour le label Indebel a été approuvée. Félicitations !\n\n${reason ? 'Commentaire de l\'administrateur: ' + reason + '\n\n' : ''}Vous pouvez maintenant voir votre label sur votre profil.\n\nCordialement,\nL'équipe Indebel`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; margin: 0;">🎉 Félicitations !</h1>
            </div>
            
            <p style="color: #333; line-height: 1.6; font-size: 16px;">
              Bonjour <strong>${request.prenom}</strong>,
            </p>
            
            <p style="color: #333; line-height: 1.6;">
              Nous avons le plaisir de vous informer que votre demande exceptionnelle pour le <strong>Label Indebel</strong> a été approuvée !
            </p>
            
            ${reason ? `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0ea5e9;">Commentaire de l'administrateur :</h3>
              <p style="margin: 0; color: #666;">${reason}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <img src="${frontendUrl}/label.png" alt="Label Indebel" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0ea5e9;">Avantages de votre Label :</h3>
              <ul style="margin: 0; color: #666; padding-left: 20px;">
                <li>Visibilité accrue sur la plateforme</li>
                <li>Badge de qualité sur votre profil</li>
                <li>Accès prioritaire aux missions premium</li>
                <li>Confiance renforcée des employeurs</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Votre label apparaît désormais sur votre profil public et vous donne accès à des opportunités exclusives.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/freelancer/profile" 
                 style="background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-right: 10px;">
                Voir mon profil
              </a>
              <a href="${frontendUrl}/freelancer/missions" 
                 style="background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Découvrir les missions
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
              <p>Cordialement,<br><strong>L'équipe Indebel</strong></p>
            </div>
          </div>
        </div>
        `
      );
      console.log('✅ Email d\'approbation envoyé à:', request.email);
    } catch (emailError) {
      console.error('❌ Erreur envoi email demande approuvée:', emailError);
    }

    res.json({
      success: true,
      message: 'Demande approuvée et label accordé avec succès'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erreur approve exceptional request:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de la demande'
    });
  } finally {
    if (connection) connection.release();
  }
};

// Rejeter une demande exceptionnelle (admin)
exports.rejectExceptionalRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { requestId } = req.params;
    const { reason = '' } = req.body;
    const adminId = req.user.id;

    console.log(`[LabelAdmin] Début rejet demande ${requestId} par admin ${adminId}`);

    await connection.beginTransaction();

    // 1. Récupérer la demande
    const [requests] = await connection.query(`
      SELECT er.*, u.email, u.prenom, u.nom 
      FROM label_exceptional_requests er
      JOIN users u ON er.user_id = u.id
      WHERE er.id = ?
    `, [requestId]);

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    const request = requests[0];

    // Vérifier si déjà traitée
    if (request.statut !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cette demande a déjà été traitée (statut actuel: ${request.statut})`
      });
    }

    // 2. Rejeter la demande
    await connection.query(
      'UPDATE label_exceptional_requests SET statut = ?, processed_at = NOW(), processed_by = ?, admin_response = ? WHERE id = ?',
      ['rejected', adminId, reason, requestId]
    );

    await connection.commit();
    console.log(`[LabelAdmin] Demande ${requestId} rejetée avec succès`);

    // 3. Envoyer une notification à l'utilisateur (après commit)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      await sendEmail(
        request.email,
        '❌ Décision concernant votre demande de Label Indebel',
        `Bonjour ${request.prenom},\n\nAprès examen attentif de votre demande exceptionnelle pour le label Indebel, nous devons malheureusement vous informer qu'elle n'a pas été retenue.\n\n${reason ? 'Motif: ' + reason + '\n\n' : ''}Vous pouvez soumettre une nouvelle demande après avoir amélioré votre profil selon les critères d'éligibilité.\n\nCordialement,\nL'équipe Indebel`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0;">📋 Décision concernant votre demande</h1>
            </div>
            
            <p style="color: #333; line-height: 1.6; font-size: 16px;">
              Bonjour <strong>${request.prenom}</strong>,
            </p>
            
            <p style="color: #333; line-height: 1.6;">
              Après examen attentif de votre demande exceptionnelle pour le <strong>Label Indebel</strong>, nous devons malheureusement vous informer qu'elle n'a pas été retenue à ce stade.
            </p>
            
            ${reason ? `
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #dc2626;">Motif de la décision :</h3>
              <p style="margin: 0; color: #666;">${reason}</p>
            </div>
            ` : ''}
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0ea5e9;">Comment améliorer votre candidature :</h3>
              <ul style="margin: 0; color: #666; padding-left: 20px;">
                <li>Complétez entièrement votre profil professionnel</li>
                <li>Ajoutez des références clients ou des témoignages</li>
                <li>Enrichissez votre portfolio avec vos meilleurs projets</li>
                <li>Obtenez des évaluations positives de vos missions</li>
                <li>Démontrez votre expertise dans votre domaine</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              N'hésitez pas à soumettre une nouvelle demande une fois que vous aurez renforcé votre profil selon ces recommandations.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/freelancer/profile/edit" 
                 style="background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; margin-right: 10px;">
                Améliorer mon profil
              </a>
              <a href="${frontendUrl}/freelancer/label-eligibility" 
                 style="background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Voir les critères
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
              <p>Cordialement,<br><strong>L'équipe Indebel</strong></p>
            </div>
          </div>
        </div>
        `
      );
      console.log('✅ Email de rejet envoyé à:', request.email);
    } catch (emailError) {
      console.error('❌ Erreur envoi email demande rejetée:', emailError);
    }

    res.json({
      success: true,
      message: 'Demande rejetée avec succès'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erreur reject exceptional request:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet de la demande'
    });
  } finally {
    if (connection) connection.release();
  }
};
