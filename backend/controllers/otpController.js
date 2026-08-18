const db = require('../config/database');
const { sendEmail, emailTemplates, generateOTP } = require('../config/email');

// Envoyer OTP
exports.sendOTP = async (req, res, next) => {
  try {
    const { email, type, userId, name } = req.body; // type: 'registration' ou 'login'

    // Générer OTP 6 chiffres
    const otp = generateOTP();

    // Expiration dans 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Supprimer les anciens OTP non vérifiés pour cet email
    await db.query(
      'DELETE FROM otp_codes WHERE email = ? AND verified = FALSE',
      [email]
    );

    // Insérer le nouveau OTP (nettoyer l'email et l'OTP)
    await db.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId || null, email.trim().toLowerCase(), otp.trim(), type, expiresAt]
    );

    console.log('📧 OTP créé:', { email: email.trim().toLowerCase(), otp: otp.trim(), type });

    // Envoyer l'email
    const emailConfig = emailTemplates.otpVerification(name || 'Utilisateur', otp);
    emailConfig.to = email;

    await sendEmail(emailConfig);

    res.json({
      success: true,
      message: 'Code de vérification envoyé par email',
      expiresIn: 600 // 10 minutes en secondes
    });
  } catch (error) {
    console.error('Erreur envoi OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du code de vérification'
    });
  }
};

// Vérifier OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Nettoyer et convertir l'OTP en string
    const cleanOtp = String(otp).trim();
    const cleanEmail = email.trim().toLowerCase();

    console.log('🔍 Vérification OTP:', { email: cleanEmail, otp: cleanOtp });

    // Chercher l'OTP valide
    const [otpRecords] = await db.query(
      `SELECT * FROM otp_codes 
       WHERE LOWER(TRIM(email)) = ? 
       AND TRIM(otp_code) = ? 
       AND verified = FALSE 
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (otpRecords.length === 0) {
      // Debug: vérifier si un OTP existe pour cet email
      const [debugRecords] = await db.query(
        'SELECT id, otp_code, verified, expires_at, created_at FROM otp_codes WHERE LOWER(TRIM(email)) = ? ORDER BY created_at DESC LIMIT 1',
        [cleanEmail]
      );
      console.log('❌ OTP non trouvé. Debug:', debugRecords[0] || 'Aucun OTP pour cet email');

      return res.status(400).json({
        success: false,
        message: 'Code invalide ou expiré'
      });
    }

    const otpRecord = otpRecords[0];

    console.log('✅ OTP trouvé:', { id: otpRecord.id, type: otpRecord.type });

    // Marquer l'OTP comme vérifié
    await db.query(
      'UPDATE otp_codes SET verified = TRUE, verified_at = NOW() WHERE id = ?',
      [otpRecord.id]
    );

    // Marquer l'email comme vérifié dans la table users si user_id existe
    if (otpRecord.user_id) {
      await db.query(
        'UPDATE users SET email_verified = TRUE WHERE id = ?',
        [otpRecord.user_id]
      );

      // Récupérer les infos user pour le token
      const [users] = await db.query(
        'SELECT id, email, role, nom, prenom, denomination, admin_permissions, created_by, nom_partenariat FROM users WHERE id = ?',
        [otpRecord.user_id]
      );

      if (users.length > 0) {
        const user = users[0];

        // Générer le token JWT
        const jwt = require('jsonwebtoken');

        // Vérifier que JWT_SECRET est défini
        if (!process.env.JWT_SECRET) {
          console.error('❌ JWT_SECRET non défini dans .env');
          throw new Error('Configuration JWT manquante');
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, admin_permissions: user.admin_permissions },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        console.log('🔐 Token généré:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          tokenLength: token?.length,
          tokenType: typeof token,
          tokenPreview: token?.substring(0, 30) + '...'
        });

        // Mettre à jour derniere_connexion et last_login pour login
        if (otpRecord.type === 'login') {
          await db.query(
            'UPDATE users SET derniere_connexion = NOW(), last_login = NOW() WHERE id = ?',
            [otpRecord.user_id]
          );
        }

        // Envoyer email de bienvenue après vérification OTP (seulement pour inscription)
        if (otpRecord.type === 'registration') {
          try {
            let welcomeEmailConfig;

            if (user.role === 'freelancer') {
              welcomeEmailConfig = emailTemplates.welcomeFreelancerEmail(
                user.prenom || '',
                user.nom || '',
                user.email
              );
            } else if (user.role === 'employer') {
              welcomeEmailConfig = emailTemplates.welcomeEmployerEmail(
                user.denomination || `${user.prenom} ${user.nom}`,
                user.email
              );
            } else {
              // Fallback pour admin ou autres rôles
              welcomeEmailConfig = emailTemplates.welcomeEmail(
                user.prenom || user.nom,
                user.email
              );
            }

            await sendEmail(welcomeEmailConfig);
            console.log('✅ Email de bienvenue envoyé à:', user.email, '(role:', user.role + ')');

            // Créer notification de bienvenue
            const additionalNotif = require('../services/additionalNotifications');
            const userName = user.role === 'employer'
              ? (user.denomination || `${user.prenom} ${user.nom}`)
              : `${user.prenom} ${user.nom}`;

            await additionalNotif.sendWelcomeNotification(
              user.id,
              user.email,
              userName,
              user.role
            );
          } catch (emailError) {
            console.error('⚠️ Erreur envoi email de bienvenue:', emailError.message);
            // Ne pas bloquer la connexion si l'email de bienvenue échoue
          }
        }

        return res.json({
          success: true,
          message: 'Email vérifié avec succès',
          token,
          user: {
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Code vérifié avec succès'
    });
  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du code'
    });
  }
};

// Renvoyer OTP
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Récupérer le dernier OTP pour cet email
    const [lastOtp] = await db.query(
      `SELECT * FROM otp_codes 
       WHERE email = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email]
    );

    if (lastOtp.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune demande de vérification trouvée'
      });
    }

    const record = lastOtp[0];

    // Récupérer le nom de l'utilisateur
    let name = 'Utilisateur';
    if (record.user_id) {
      const [users] = await db.query(
        'SELECT nom, prenom FROM users WHERE id = ?',
        [record.user_id]
      );
      if (users.length > 0) {
        name = users[0].prenom || users[0].nom;
      }
    }

    // Renvoyer un nouveau code
    await exports.sendOTP(
      { body: { email, type: record.type, userId: record.user_id, name } },
      res,
      next
    );
  } catch (error) {
    console.error('Erreur renvoi OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi du code'
    });
  }
};
