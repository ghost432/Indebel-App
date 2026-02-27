const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendEmail, emailTemplates, generateOTP } = require('../config/email');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const {
      nom,
      prenom,
      email,
      mot_de_passe,
      role,
      numero_bce,
      adresse,
      denomination,
      pays_code,
      indicatif,
      telephone,
      secteur,
      competences,
      competences_recherchees,
      accepte_cgu,
      accepte_notifications,
      accepte_emails
    } = req.body;

    // Check if user already exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Check if BCE number is already used
    if (numero_bce) {
      const [existingBce] = await db.query(
        'SELECT id FROM users WHERE numero_bce = ?',
        [numero_bce]
      );

      if (existingBce.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ce numéro BCE est déjà utilisé'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Prepare competences JSON
    const competencesJSON = competences ? JSON.stringify(competences) : null;
    const competencesRecherchesJSON = competences_recherchees ? JSON.stringify(competences_recherchees) : null;

    // Initialiser langues_parlees avec Français par défaut pour le profil public
    const languesParlees = JSON.stringify(['Français']);

    // Set statut_verification to 'verifie' for employers, 'non_verifie' for others
    const statutVerification = role === 'employer' ? 'verifie' : 'non_verifie';

    // Attribuer le forfait gratuit selon le rôle
    // Forfait ID 1 pour freelancer, ID 4 pour employer
    const forfaitId = role === 'freelancer' ? 1 : role === 'employer' ? 4 : null;

    // Insert new user avec forfait gratuit
    const [result] = await db.query(
      `INSERT INTO users (
        nom, prenom, email, email_verified, mot_de_passe_hash, role, 
        numero_bce, denomination, adresse, pays_code, indicatif, telephone,
        secteur, competences, competences_recherchees, langues_parlees,
        accepte_cgu, accepte_notifications, accepte_emails, statut_verification,
        forfait_id, forfait_date_debut, forfait_statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nom || null,
        prenom || null,
        email,
        false, // email_verified starts as false
        hashedPassword,
        role,
        numero_bce || null,
        denomination || null,
        adresse || null,
        pays_code || 'BE',
        indicatif || '+32',
        telephone || null,
        secteur || null,
        competencesJSON,
        competencesRecherchesJSON,
        languesParlees,
        accepte_cgu || false,
        accepte_notifications || false,
        accepte_emails || false,
        statutVerification,
        forfaitId,
        new Date(), // forfait_date_debut (Set to now for free plans)
        'actif' // forfait_statut
      ]
    );

    const userId = result.insertId;

    // Générer et envoyer OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, email.trim().toLowerCase(), otp.trim(), 'registration', expiresAt]
    );

    // Envoyer l'email OTP avec timeout
    const emailConfig = emailTemplates.otpVerification(prenom || nom || denomination, otp);
    emailConfig.to = email;

    console.log(`[Register] Envoi OTP à ${email}...`);

    // Timeout de 5 secondes pour l'envoi d'email
    const sendEmailPromise = sendEmail(emailConfig);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000));

    const emailResult = await Promise.race([sendEmailPromise, timeoutPromise]);

    if (!emailResult.success) {
      console.warn(`[Register] Échec ou timeout envoi OTP à ${email}:`, emailResult.error);
      // On continue quand même, l'utilisateur pourra demander un renvoi
    } else {
      console.log(`[Register] OTP envoyé à ${email}`);
    }

    // Notifier les admins de la nouvelle inscription (async)
    const additionalNotif = require('../services/additionalNotifications');
    additionalNotif.notifyAdminsNewUser({
      prenom: prenom || '',
      nom: nom || '',
      email: email,
      role: role,
      denomination: denomination || ''
    }).catch(err => console.error('Erreur notification async admin:', err));

    // Générer la première facture (proforma) pour le forfait initial (ASYNC - Non bloquant)
    if (forfaitId) {
      (async () => {
        try {
          console.log(`[Register] Génération facture pour user ${userId}...`);
          const FactureService = require('../services/factureService');
          const connection = await db.getConnection();
          const proforma = await FactureService.creerFacture(
            connection,
            userId,
            forfaitId,
            new Date(), // forfait_date_debut
            null // forfait_date_expiration
          );
          connection.release();
          console.log(`[Register] Facture générée pour user ${userId}`);

          // Notifier les admins du nouvel abonnement (même gratuit)
          const [forfaits] = await db.query('SELECT * FROM forfaits WHERE id = ?', [forfaitId]);
          if (forfaits.length > 0) {
            additionalNotif.notifyAdminsNewSubscription(
              { id: userId, prenom: prenom || '', nom: nom || '', email, role, denomination: denomination || '' },
              forfaits[0]
            ).catch(err => console.error('Erreur notification admin abonnement:', err));
          }
        } catch (factureError) {
          console.error('❌ Erreur génération histoire forfait:', factureError);
        }
      })();
    }

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Vérifiez votre email pour le code de vérification.',
      data: {
        userId,
        email,
        role,
        requiresOTP: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Find user
    const [users] = await db.query(
      `SELECT 
        u.id, u.nom, u.prenom, u.email, u.mot_de_passe_hash, u.role, u.derniere_connexion, u.last_login,
        (SELECT COUNT(*) FROM labels l WHERE l.user_id = u.id AND l.statut = 'actif') as has_exceptional_label,
        (SELECT COUNT(*) FROM label_indebel li WHERE li.user_id = u.id AND li.statut = 'accepte') as has_standard_label
       FROM users u WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];
    const hasLabel = user.has_exceptional_label > 0 || user.has_standard_label > 0;

    // Check password
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si OTP est nécessaire
    const requiresOTP = () => {
      // Admin : jamais d'OTP
      if (user.role === 'admin') return false;

      // Si jamais connecté ou derniere_connexion est null
      if (!user.derniere_connexion) return true;

      // Vérifier si derniere_connexion > 3 jours
      const derniereConnexion = new Date(user.derniere_connexion);
      const maintenant = new Date();
      const diffJours = (maintenant - derniereConnexion) / (1000 * 60 * 60 * 24);

      // OTP requis si plus de 3 jours sans connexion
      return diffJours > 3;
    };

    const needsOTP = requiresOTP();

    // Si pas besoin d'OTP, connexion directe
    if (!needsOTP) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Mettre à jour derniere_connexion et last_login
      await db.query(
        'UPDATE users SET derniere_connexion = NOW(), last_login = NOW() WHERE id = ?',
        [user.id]
      );

      return res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            hasLabel: hasLabel
          },
          token
        }
      });
    }

    // Sinon, envoyer OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const cleanEmail = email.trim().toLowerCase();

    // Supprimer les anciens OTP
    await db.query(
      'DELETE FROM otp_codes WHERE LOWER(TRIM(email)) = ? AND verified = FALSE',
      [cleanEmail]
    );

    // Insérer nouveau OTP
    await db.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, cleanEmail, otp.trim(), 'login', expiresAt]
    );

    // Envoyer l'email OTP
    const emailConfig = emailTemplates.otpVerification(user.prenom || user.nom, otp);
    emailConfig.to = email;
    await sendEmail(emailConfig);

    res.json({
      success: true,
      message: 'Code de vérification envoyé par email',
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        requiresOTP: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT 
        u.id, u.prenom, u.nom, u.email, u.role, u.date_creation,
        u.denomination, u.numero_bce, u.adresse, u.secteur,
        u.description_entreprise, u.site_web, u.taille_entreprise,
        u.poste, u.competences, u.competences_recherchees,
        u.pays_code, u.indicatif, u.telephone,
        u.experience, u.tarif_journalier, u.disponibilite, u.portfolio_url,
        u.statut_verification, u.forfait_id,
        u.linkedin, u.twitter, u.facebook, u.instagram,
        u.email_contact, u.annee_creation,
        u.a_propos, u.genre, u.tranche_age,
        u.langues_parlees, u.disponibilite_debut, u.disponibilite_fin,
        u.photo_profil, u.image_couverture,
        f.nom AS forfait_nom, f.couleur_badge AS forfait_couleur, f.peut_publier_missions,
        (
          SELECT COUNT(*) 
          FROM labels l 
          WHERE l.user_id = u.id AND l.statut = 'actif'
        ) as has_exceptional_label,
        (
          SELECT COUNT(*) 
          FROM label_indebel li 
          WHERE li.user_id = u.id AND li.statut = 'accepte'
        ) as has_standard_label
      FROM users u
      LEFT JOIN forfaits f ON u.forfait_id = f.id
      WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Combine label status
    user.hasLabel = user.has_exceptional_label > 0 || user.has_standard_label > 0;

    // Remove temporary fields
    delete user.has_exceptional_label;
    delete user.has_standard_label;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Check if email exists
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const [users] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length > 0) {
      return res.json({
        success: true,
        exists: true,
        message: 'Cet email est déjà utilisé'
      });
    }

    res.status(404).json({
      success: true,
      exists: false,
      message: 'Email disponible'
    });
  } catch (error) {
    next(error);
  }
};

// Demander une réinitialisation de mot de passe
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    // Vérifier si l'utilisateur existe
    const [users] = await db.query(
      'SELECT id, nom, prenom, denomination, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return res.json({
        success: true,
        message: 'Si cet email existe dans notre système, un lien de réinitialisation vous a été envoyé.'
      });
    }

    const user = users[0];
    const userName = user.denomination || user.prenom || user.nom;

    // Générer un token de réinitialisation
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Stocker le token dans la base de données
    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Envoyer l'email de réinitialisation
    try {
      const emailConfig = emailTemplates.resetPassword(userName, resetToken);
      emailConfig.to = user.email;
      await sendEmail(emailConfig);

      console.log('✅ Email de réinitialisation envoyé à:', user.email);
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation'
      });
    }

    res.json({
      success: true,
      message: 'Un lien de réinitialisation a été envoyé à votre adresse email.'
    });
  } catch (error) {
    next(error);
  }
};

// Réinitialiser le mot de passe
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis'
      });
    }

    // Vérifier si le token existe et n'est pas expiré
    const [users] = await db.query(
      'SELECT id, email, nom, prenom FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const user = users[0];

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et supprimer le token
    await db.query(
      'UPDATE users SET mot_de_passe_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    console.log('✅ Mot de passe réinitialisé pour:', user.email);

    res.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
    });
  } catch (error) {
    next(error);
  }
};

