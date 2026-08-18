const db = require('../config/database');
const { sendEmail, emailTemplates, getAdminEmails } = require('../config/email');

// Soumettre les documents de vérification (Freelancer)
exports.submitVerification = async (req, res, next) => {
  try {
    const {
      nom_complet,
      date_naissance,
      adresse_complete,
      telephone,
      email,
      type_document,
      numero_document,
      document_recto,
      document_verso,
      selfie_document,
      assurance_rc_professionnelle,
      justificatif_domicile,
      extrait_bce,
      attestation_cotisations_sociales,
      a_permis_conduire,
      categorie_permis_conduire,
      document_permis_conduire,
      a_permis_chariot,
      nombre_permis_chariot,
      document_permis_chariot
    } = req.body;
    const user_id = req.user.id;

    // Récupérer les infos complètes de l'utilisateur
    const [userInfo] = await db.query(
      'SELECT prenom, nom, email FROM users WHERE id = ?',
      [user_id]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userFullName = nom_complet || `${userInfo[0].prenom} ${userInfo[0].nom}`;
    const userEmail = email || userInfo[0].email;

    // Vérifier que l'utilisateur est un freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les prestataires peuvent soumettre une vérification'
      });
    }

    // Vérifier qu'une vérification n'est pas déjà en attente
    const [existingUser] = await db.query(
      'SELECT statut_verification FROM users WHERE id = ?',
      [user_id]
    );

    if (existingUser[0].statut_verification === 'en_cours') {
      return res.status(400).json({
        success: false,
        message: 'Une demande de vérification est déjà en cours de traitement'
      });
    }

    if (existingUser[0].statut_verification === 'verifie') {
      return res.status(400).json({
        success: false,
        message: 'Votre compte est déjà vérifié'
      });
    }

    // Insérer la demande de vérification
    await db.query(
      `INSERT INTO verifications_identite (
        freelancer_id, nom_complet, date_naissance, adresse_complete, telephone,
        type_document, numero_document, document_recto, document_verso, selfie_document,
        assurance_rc_professionnelle, justificatif_domicile, extrait_bce, attestation_cotisations_sociales,
        a_permis_conduire, categorie_permis_conduire, document_permis_conduire,
        a_permis_chariot, nombre_permis_chariot, document_permis_chariot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, nom_complet, date_naissance, adresse_complete, telephone,
        type_document, numero_document, document_recto, document_verso, selfie_document,
        assurance_rc_professionnelle, justificatif_domicile, extrait_bce, attestation_cotisations_sociales,
        a_permis_conduire || false, categorie_permis_conduire, document_permis_conduire,
        a_permis_chariot || false, nombre_permis_chariot, document_permis_chariot
      ]
    );

    // Mettre à jour le statut dans users
    await db.query(
      `UPDATE users SET statut_verification = 'en_cours' WHERE id = ?`,
      [user_id]
    );

    // Créer une notification pour le freelancer
    await db.query(
      `INSERT INTO notifications (user_id, titre, message, type, lien)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user_id,
        '✅ Demande de vérification envoyée',
        'Votre demande de vérification d\'identité a bien été reçue et sera traitée sous 24-48h. Vous recevrez un email de confirmation une fois validée.',
        'success',
        '/freelancer/verification'
      ]
    );

    // Notifier les admins (non-bloquant)
    // Notifier les admins (non-bloquant)
    try {
      const emailConfig = emailTemplates.newVerificationAdmin({
        prenom: userInfo[0].prenom,
        nom: userInfo[0].nom,
        email: userEmail,
        type_document
      });
      sendEmail(emailConfig).catch(e => console.error('❌ Erreur envoi email admin verification:', e));
    } catch (e) {
      console.error('❌ Erreur préparation email admin:', e);
    }

    // Créer notifications in-app pour les admins en base (non-bloquant)
    db.query('SELECT id FROM users WHERE role = "admin"')
      .then(([admins]) => {
        const notifPromises = admins.map(admin =>
          db.query(
            `INSERT INTO notifications (user_id, titre, message, type, lien)
             VALUES (?, ?, ?, ?, ?)`,
            [
              admin.id,
              '🆕 Nouvelle demande de vérification d\'identité',
              `${userFullName} a soumis une demande de vérification d'identité. Type de document : ${type_document.replace('_', ' ')}. Cliquez pour traiter la demande.`,
              'info',
              '/admin/verifications'
            ]
          )
        );
        return Promise.all(notifPromises);
      })
      .catch(notifError => console.error('❌ Erreur notifications in-app admins:', notifError));

    // Envoyer email de confirmation au freelancer (non-bloquant)
    sendEmail({
      to: userEmail,
      subject: '✅ Demande de vérification d\'identité reçue avec succès',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Demande Reçue avec Succès</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Bonjour ${userInfo[0].prenom},
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
              🎉 Excellente nouvelle ! Nous avons bien reçu votre demande de vérification d'identité. 
              Votre dossier est maintenant en cours de traitement par notre équipe.
            </p>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">📋 Récapitulatif de votre demande</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #047857; font-weight: 600;">📄 Type de document :</td>
                  <td style="padding: 8px 0; color: #065f46;">${type_document.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857; font-weight: 600;">📅 Date de soumission :</td>
                  <td style="padding: 8px 0; color: #065f46;">${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857; font-weight: 600;">📊 Statut :</td>
                  <td style="padding: 8px 0; color: #065f46;"><strong>En cours de traitement</strong></td>
                </tr>
              </table>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0284c7;">
              <h3 style="color: #0c4a6e; margin-top: 0; font-size: 18px;">📅 Prochaines étapes</h3>
              <ol style="color: #0c4a6e; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">
                  <strong>Vérification des documents</strong> - Notre équipe examine attentivement vos documents (sous 24-48h)
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>Notification par email</strong> - Vous recevrez un email dès que la vérification sera terminée
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>Activation du compte</strong> - Une fois validé, votre profil sera certifié et mis en avant
                </li>
              </ol>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${process.env.FRONTEND_URL}/freelancer/dashboard" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                📊 Retour au tableau de bord
              </a>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin-top: 25px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                💡 <strong>Bon à savoir :</strong> Pendant le traitement, vous pouvez continuer à utiliser la plateforme normalement. 
                Vous serez notifié dès que votre vérification sera complète.
              </p>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 25px;">
              <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                <strong>Besoin d'aide ?</strong>
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 14px;">
                Si vous avez des questions, n'hésitez pas à nous contacter à 
                <a href="mailto:info@indebel.be" style="color: #4F46E5; text-decoration: none;">info@indebel.be</a>
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6B7280; font-size: 14px; margin: 0;">
                Cordialement,<br>
                <strong style="color: #10b981;">L'équipe Indebel</strong>
              </p>
            </div>
          </div>
        </div>
      `
    }).catch(e => console.error('❌ Erreur envoi email confirmation freelancer:', e));

    res.json({
      success: true,
      message: 'Documents soumis avec succès. Votre demande sera traitée dans les plus brefs délais.'
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer le statut de vérification (Freelancer)
exports.getVerificationStatus = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const [users] = await db.query(
      `SELECT statut_verification FROM users WHERE id = ?`,
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Récupérer la dernière demande de vérification
    const [verifications] = await db.query(
      `SELECT * FROM verifications_identite 
       WHERE freelancer_id = ? 
       ORDER BY date_soumission DESC LIMIT 1`,
      [user_id]
    );

    res.json({
      success: true,
      data: {
        statut: users[0].statut_verification,
        derniere_demande: verifications[0] || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer toutes les demandes de vérification (Admin)
exports.getAllVerifications = async (req, res, next) => {
  try {
    const { statut } = req.query;

    let query = `
      SELECT 
        v.id, v.freelancer_id, v.nom_complet, v.date_naissance, v.adresse_complete, v.telephone,
        v.type_document, v.numero_document, v.statut, v.motif_refus, v.date_soumission, v.date_traitement,
        v.traite_par, v.a_permis_conduire, v.categorie_permis_conduire, v.a_permis_chariot, v.nombre_permis_chariot,
        u.prenom,
        u.nom,
        u.email,
        u.photo_profil,
        u.statut_verification,
        admin.prenom as admin_prenom,
        admin.nom as admin_nom
      FROM verifications_identite v
      INNER JOIN users u ON v.freelancer_id = u.id
      LEFT JOIN users admin ON v.traite_par = admin.id
      WHERE 1=1
    `;

    const params = [];

    if (statut && statut !== 'all') {
      query += ' AND v.statut = ?';
      params.push(statut);
    }

    query += ' ORDER BY v.date_soumission DESC';

    const [verifications] = await db.query(query, params);

    // Ensure dates are strings to avoid serialization issues
    const safeVerifications = verifications.map(v => ({
      ...v,
      date_soumission: v.date_soumission ? v.date_soumission.toISOString() : null,
      date_traitement: v.date_traitement ? v.date_traitement.toISOString() : null,
      date_naissance: v.date_naissance ? (v.date_naissance instanceof Date ? v.date_naissance.toISOString() : v.date_naissance) : null
    }));

    res.json({ success: true, data: safeVerifications });
  } catch (error) {
    next(error);
  }
};

// Récupérer une vérification spécifique (Admin)
exports.getVerificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [verifications] = await db.query(
      `SELECT v.*, u.prenom, u.nom, u.email, u.photo_profil, u.statut_verification
       FROM verifications_identite v
       INNER JOIN users u ON v.freelancer_id = u.id
       WHERE v.id = ?`,
      [id]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const v = verifications[0];
    v.date_soumission = v.date_soumission ? v.date_soumission.toISOString() : null;
    v.date_traitement = v.date_traitement ? v.date_traitement.toISOString() : null;
    v.date_naissance = v.date_naissance ? (v.date_naissance instanceof Date ? v.date_naissance.toISOString() : v.date_naissance) : null;

    res.json({ success: true, data: v });
  } catch (error) {
    next(error);
  }
};

// Valider une vérification (Admin)
exports.validateVerification = async (req, res, next) => {
  try {
    const { verification_id } = req.params;
    const admin_id = req.user.id;

    // Récupérer la demande de vérification
    const [verifications] = await db.query(
      `SELECT v.*, u.prenom, u.nom, u.email,
        u.photo_profil, u.id as user_id
       FROM verifications_identite v
       INNER JOIN users u ON v.freelancer_id = u.id
       WHERE v.id = ?`,
      [verification_id]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const verification = verifications[0];

    if (verification.statut !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Mettre à jour la vérification
    await db.query(
      `UPDATE verifications_identite SET
        statut = 'valide',
        date_traitement = NOW(),
        traite_par = ?
       WHERE id = ?`,
      [admin_id, verification_id]
    );

    console.log('✅ Validation - Mise à jour du statut pour user_id:', verification.user_id);

    // Mettre à jour le statut utilisateur
    const [updateResult] = await db.query(
      `UPDATE users SET statut_verification = 'verifie' WHERE id = ?`,
      [verification.user_id]
    );

    console.log('✅ Résultat de la mise à jour:', {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows,
      user_id: verification.user_id
    });

    // Vérifier que la mise à jour a bien fonctionné
    const [checkUser] = await db.query(
      `SELECT id, statut_verification FROM users WHERE id = ?`,
      [verification.user_id]
    );

    console.log('✅ Statut après mise à jour:', checkUser[0]);

    // Créer une notification pour le freelancer
    await db.query(
      `INSERT INTO notifications (user_id, titre, message, type, lien)
       VALUES (?, ?, ?, ?, ?)`,
      [
        verification.user_id,
        '✅ Identité vérifiée',
        'Félicitations ! Votre identité a été vérifiée avec succès. Vous pouvez maintenant postuler aux missions.',
        'success',
        '/freelancer/verification'
      ]
    );

    // Envoyer un email au freelancer
    await sendEmail({
      to: verification.email,
      subject: '✅ Votre identité a été vérifiée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">🎉 Félicitations !</h2>
          <p>Bonjour ${verification.prenom},</p>
          <p>Nous avons le plaisir de vous informer que votre identité a été <strong>vérifiée avec succès</strong>.</p>
          
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <p style="color: #065F46; margin: 0;">
              ✅ Votre profil affiche maintenant le badge bleu "Vérifié" qui renforce votre crédibilité auprès des recruteurs.
            </p>
          </div>

          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/freelancer/profile" 
               style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mon profil
            </a>
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Cordialement,<br>
            L'équipe Indebel
          </p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Vérification validée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Refuser une vérification (Admin)
exports.rejectVerification = async (req, res, next) => {
  try {
    const { verification_id } = req.params;
    const { motif_refus } = req.body;
    const admin_id = req.user.id;

    if (!motif_refus) {
      return res.status(400).json({
        success: false,
        message: 'Un motif de refus est requis'
      });
    }

    // Récupérer la demande de vérification
    const [verifications] = await db.query(
      `SELECT v.*, u.prenom, u.nom, u.email,
        u.photo_profil, u.id as user_id
       FROM verifications_identite v
       INNER JOIN users u ON v.freelancer_id = u.id
       WHERE v.id = ?`,
      [verification_id]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const verification = verifications[0];

    if (verification.statut !== 'en_attente') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Mettre à jour la vérification
    await db.query(
      `UPDATE verifications_identite SET
        statut = 'refuse',
        date_traitement = NOW(),
        traite_par = ?,
        motif_refus = ?
       WHERE id = ?`,
      [admin_id, motif_refus, verification_id]
    );

    // Mettre à jour le statut utilisateur - REMETTRE À NON VÉRIFIÉ
    await db.query(
      `UPDATE users SET statut_verification = 'non_verifie' WHERE id = ?`,
      [verification.user_id]
    );

    // Créer une notification pour le freelancer
    await db.query(
      `INSERT INTO notifications (user_id, titre, message, type, lien)
       VALUES (?, ?, ?, ?, ?)`,
      [
        verification.user_id,
        'Vérification refusée',
        `Votre demande de vérification a été refusée. Motif : ${motif_refus}. Vous pouvez soumettre une nouvelle demande.`,
        'error',
        '/freelancer/verification'
      ]
    );

    // Envoyer un email au freelancer
    await sendEmail({
      to: verification.email,
      subject: 'Vérification d\'identité - Documents à revoir',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Vérification d'identité</h2>
          <p>Bonjour ${verification.prenom},</p>
          <p>Nous avons examiné vos documents de vérification d'identité.</p>
          
          <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <p style="color: #991B1B; margin: 0 0 10px 0;">
              <strong>Raison du refus :</strong>
            </p>
            <p style="color: #7F1D1D; margin: 0;">
              ${motif_refus}
            </p>
          </div>

          <p>Veuillez soumettre à nouveau vos documents en tenant compte de ces remarques.</p>

          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/freelancer/verification" 
               style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Soumettre à nouveau
            </a>
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Cordialement,<br>
            L'équipe Indebel
          </p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Vérification refusée. Le freelancer a été notifié.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
