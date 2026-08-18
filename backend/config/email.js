const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@indebel.be',
    pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('✅ Email transporter configured (Hostinger SMTP)');

// Helper to get admin emails
const getAdminEmails = () => {
  const emails = process.env.ADMIN_EMAILS || 'indegobelgique@gmail.com, ulrichthierry47@gmail.com';
  // Retourner la chaîne brute pour une meilleure compatibilité avec les relais SMTP
  return emails;
};

// Email templates
const emailTemplates = {
  // Notification Admin - Nouvelle inscription
  newRegistrationAdmin: (user) => ({
    from: '"Indebel System" <noreply@indebel.be>',
    to: getAdminEmails(),
    subject: `🆕 Nouvelle inscription:${user.role === 'employer' ? 'Recruteur' : 'Prestataire'} - ${user.prenom} ${user.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Nouvelle Inscription</h2>
        <p>Un nouvel utilisateur vient de s'inscrire sur la plateforme.</p>
        <ul>
          <li><strong>Nom :</strong> ${user.prenom} ${user.nom}</li>
          <li><strong>Email :</strong> ${user.email}</li>
          <li><strong>Rôle :</strong> ${user.role === 'employer' ? 'Recruteur' : 'Prestataire'}</li>
          ${user.denomination ? `<li><strong>Société :</strong> ${user.denomination}</li>` : ''}
          <li><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/admin/users" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir l'utilisateur</a>
      </div>
    `
  }),

  // Notification Admin - Nouvelle mission à valider
  newMissionAdmin: (mission, employer) => ({
    from: '"Indebel System" <noreply@indebel.be>',
    to: getAdminEmails(),
    subject: `📋 Nouvelle mission à valider:${mission.titre}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Mission en attente de validation</h2>
        <p>Une nouvelle mission a été publiée et nécessite votre validation.</p>
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
          <h3>${mission.titre}</h3>
          <p><strong>Recruteur :</strong> ${employer.denomination || `${employer.prenom} ${employer.nom}`}</p>
          <p><strong>Type :</strong> ${mission.type}</p>
          <p><strong>Budget :</strong> ${mission.budget}</p>
        </div>
        <p>Veuillez vérifier le contenu de la mission avant de l'approuver.</p>
        <a href="${process.env.FRONTEND_URL}/admin/missions" style="display: inline-block; background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Gérer la mission</a>
      </div>
    `
  }),

  // Notification Recruteur - Mission en attente
  missionPendingRecruiter: (mission, employer) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: employer.email,
    subject: `⏳ Mission en attente d'approbation: ${mission.titre}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Mission reçue</h2>
        <p>Bonjour ${employer.denomination || employer.prenom},</p>
        <p>Votre mission <strong>"${mission.titre}"</strong> a bien été enregistrée.</p>
        <p>Elle est actuellement <strong>en attente d'approbation</strong> par notre équipe de modération. Vous recevrez une notification dès qu'elle sera traitée (généralement sous 24h).</p>
        <p>Merci de votre patience.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">L'équipe Indebel</p>
      </div>
    `
  }),

  // Notification Prestataire - Mission en attente
  freelancerMissionPending: (mission, freelancer) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: freelancer.email,
    subject: `⏳ Votre demande de recrutement est en attente: ${mission.titre}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Demande de recrutement reçue</h2>
        <p>Bonjour ${freelancer.prenom},</p>
        <p>Votre demande de recrutement pour <strong>"${mission.titre}"</strong> a bien été enregistrée.</p>
        <p>Notre équipe va l'étudier rapidement avant de la rendre publique. Vous recevrez une notification dès qu'elle sera validée.</p>
        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #4338ca;"><strong>✨ Pourquoi cette étape ?</strong></p>
          <p style="margin: 5px 0 0 0; color: #6366f1; font-size: 14px;">Nous vérifions chaque annonce pour garantir la qualité de la plateforme Indebel.</p>
        </div>
        <p>Merci de votre confiance.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">L'équipe Indebel</p>
      </div>
    `
  }),

  // Notification Recruteur - Mission approuvée
  missionApprovedRecruiter: (mission, employer) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: employer.email,
    subject: `✅ Mission approuvée:${mission.titre}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Mission publiée!</h2>
        <p>Bonjour ${employer.denomination || employer.prenom},</p>
        <p>Bonne nouvelle! Votre mission <strong>"${mission.titre}"</strong> a été validée par notre équipe.</p>
        <p>Elle est désormais visible par tous les prestataires qualifiés sur la plateforme.</p>
        <a href="${process.env.FRONTEND_URL}/employer/jobs" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir ma mission</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">L'équipe Indebel</p>
      </div>
    `
  }),

  // Notification Recruteur - Mission refusée
  missionRefusedRecruiter: (mission, employer) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: employer.email,
    subject: `❌ Mission refusée:${mission.titre}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Mission refusée</h2>
        <p>Bonjour ${employer.prenom},</p>
        <p>Nous sommes au regret de vous informer que votre mission <strong>"${mission.titre}"</strong> n'a pas été validée.</p>
        <p>Elle ne respecte peut-être pas certaines de nos conditions d'utilisation ou nécessite plus de détails.</p>
        <p>Vous pouvez modifier votre mission et la soumettre à nouveau.</p>
        <a href="${process.env.FRONTEND_URL}/employer/jobs" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Modifier la mission</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">L'équipe Indebel</p>
      </div>
    `
  }),

  // Notification Admin - Nouvelle mission de prestataire à valider
  newFreelancerMissionAdmin: (mission, freelancer) => ({
    from: '"Indebel System" <noreply@indebel.be>',
    to: getAdminEmails(),
    subject: `📋 Nouvelle mission de prestataire à valider: ${mission.titre} `,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Mission de prestataire à valider</h2>
        <p>Un prestataire a publié une mission qui nécessite votre validation avant d'être publique.</p>
        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #6366f1;">
          <h3>${mission.titre}</h3>
          <p><strong>Prestataire :</strong> ${freelancer.prenom} ${freelancer.nom} (${freelancer.email})</p>
          <p><strong>Localisation :</strong> ${mission.localisation}</p>
          <p><strong>Type :</strong> ${mission.type_forfait === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}</p>
        </div>
        <p>Veuillez vérifier la mission dans l'interface admin.</p>
        <a href="${process.env.FRONTEND_URL}/admin/missions-prestataires" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Gérer les missions</a>
      </div>
  `
  }),

  // Notification Prestataire - Mission approuvée
  freelancerMissionApproved: (mission, freelancer) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: freelancer.email,
    subject: `✅ Votre mission a été approuvée: ${mission.titre} `,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Bonne nouvelle!</h2>
        <p>Bonjour ${freelancer.prenom},</p>
        <p>Votre mission <strong>"${mission.titre}"</strong> a été validée par notre équipe.</p>
        <p>Elle est désormais publique et visible par tous les candidats potentiels.</p>
        <a href="${process.env.FRONTEND_URL}/freelancer/my-published-jobs" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir ma mission</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">L'équipe Indebel</p>
      </div>
  `
  }),

  // Notification Prestataire - Mission refusée
  freelancerMissionRefused: (mission, freelancer) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: freelancer.email,
    subject: `❌ Votre mission n'a pas pu être validée: ${mission.titre}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Mission non validée</h2>
        <p>Bonjour ${freelancer.prenom},</p>
        <p>Nous sommes au regret de vous informer que votre mission <strong>"${mission.titre}"</strong> n'a pas été validée par notre équipe de modération.</p>
        <p>Veuillez vérifier vos messages ou contacter le support pour en savoir plus sur les raisons de ce refus.</p>
        <a href="${process.env.FRONTEND_URL}/freelancer/my-published-jobs" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir mes missions</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">L'équipe Indebel</p>
      </div>
    `
  }),

  otpVerification: (name, otp, email) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: 'Code de vérification Indebel',
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">🔐 Indebel</h1>
        </div>
        <h2 style="color: #1f2937; margin-bottom: 20px;">Code de vérification</h2>
        <p style="color: #4b5563; font-size: 16px;">Bonjour ${name},</p>
        <p style="color: #4b5563; font-size: 16px;">Voici votre code de vérification à 6 chiffres :</p>
        <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otp}</span>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          Ou cliquez sur le bouton ci-dessous pour vous connecter automatiquement :
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/verify-otp?email=${encodeURIComponent(email)}&otp=${otp}" 
             style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Me connecter automatiquement
          </a>
        </div>
        
        <p style="color: #4b5563; font-size: 14px;">⏱️ Ce code et ce lien sont valides pendant <strong>10 minutes</strong>.</p>
        <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">⚠️ Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">Cordialement,<br />L'équipe Indebel</p>
      </div>
    </div>
  `,
  }),

  welcomeEmail: (name, email) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: 'Bienvenue sur Indebel!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Bienvenue sur Indebel!</h1>
        <p>Bonjour ${name},</p>
        <p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter et commencer à utiliser notre plateforme.</p>
        <p style="margin-top: 30px;">Cordialement,<br/>L'équipe Indebel</p>
      </div>
  `,
  }),

  welcomeFreelancerEmail: (prenom, nom, email) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: '🎉 Bienvenue sur Indebel - Votre compte prestataire',
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3b82f6; margin: 0;">🎉 Bienvenue sur Indebel!</h1>
      </div>

      <h2 style="color: #1f2937; margin-bottom: 20px;">Bonjour ${prenom} ${nom},</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Félicitations! Votre compte prestataire a été créé avec succès sur Indebel.
      </p>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0;">📧 Vos identifiants de connexion</h3>
        <p style="margin: 5px 0; color: #1f2937;"><strong>Email :</strong> ${email}</p>
        <p style="margin: 5px 0; color: #1f2937;"><strong>Mot de passe :</strong> Celui que vous avez choisi lors de l'inscription</p>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Important:Vérification d'identité</h3>
        <p style="margin: 5px 0; color: #78350f;">
          Pour postuler aux missions et obtenir votre badge vérifié, vous devez compléter la vérification de votre identité.
        </p>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">🚀 Prochaines étapes :</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>✅ Complétez votre profil</li>
          <li>✅ Vérifiez votre identité</li>
          <li>✅ Ajoutez vos compétences</li>
          <li>✅ Commencez à postuler aux missions</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/freelancer/dashboard"
          style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Accéder à mon dashboard
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Besoin d'aide ? Contactez-nous à contact@indebel.be<br />
          Cordialement,<br />L'équipe Indebel
        </p>
    </div>
      </div>
  `,
  }),

  welcomeEmployerEmail: (denomination, email) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: '🎉 Bienvenue sur Indebel - Votre compte recruteur',
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3b82f6; margin: 0;">🎉 Bienvenue sur Indebel!</h1>
      </div>

      <h2 style="color: #1f2937; margin-bottom: 20px;">Bonjour ${denomination},</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Félicitations! Votre compte recruteur a été créé avec succès sur Indebel.
      </p>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0;">📧 Vos identifiants de connexion</h3>
        <p style="margin: 5px 0; color: #1f2937;"><strong>Email :</strong> ${email}</p>
        <p style="margin: 5px 0; color: #1f2937;"><strong>Mot de passe :</strong> Celui que vous avez choisi lors de l'inscription</p>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">🚀 Commencez dès maintenant :</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>✅ Complétez votre profil recruteur</li>
          <li>✅ Publiez votre première mission</li>
          <li>✅ Trouvez les meilleurs prestataires</li>
          <li>✅ Gérez vos projets facilement</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/employer/dashboard"
          style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Accéder à mon dashboard
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Besoin d'aide ? Contactez-nous à contact@indebel.be<br />
          Cordialement,<br />L'équipe Indebel
        </p>
    </div>
      </div>
  `,
  }),

  newJobNotification: (freelancerEmail, jobTitle, jobDescription) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: freelancerEmail,
    subject: 'Nouvelle offre d\'emploi disponible',
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Nouvelle offre d'emploi</h1>
        <h2 style="color: #1f2937;">${jobTitle}</h2>
        <p>${jobDescription}</p>
        <a href="${process.env.FRONTEND_URL}/jobs" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir l'offre</a>
        <p style="margin-top: 30px;">Cordialement,<br/>L'équipe Indebel</p>
      </div>
  `,
  }),

  newApplicationNotification: (employerEmail, jobTitle, freelancerName) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: employerEmail,
    subject: 'Nouvelle candidature reçue',
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Nouvelle candidature</h1>
        <p>Vous avez reçu une nouvelle candidature pour l'offre:<strong>${jobTitle}</strong></p>
        <p>Candidat:${freelancerName}</p>
        <a href="${process.env.FRONTEND_URL}/employer/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir les candidatures</a>
        <p style="margin-top: 30px;">Cordialement,<br/>L'équipe Indebel</p>
      </div>
  `,
  }),

  resetPassword: (name, resetToken) => ({
    from: '"Indebel" <noreply@indebel.be>',
    subject: 'Réinitialisation de votre mot de passe - Indebel',
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0;">🔐 Indebel</h1>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
          
          <p style="color: #4b5563; font-size: 16px;">Bonjour ${name},</p>
          
          <p style="color: #4b5563; font-size: 16px;">
            Vous avez demandé à réinitialiser votre mot de passe sur Indebel.
          </p>
          
          <p style="color: #4b5563; font-size: 16px;">
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
            ⚠️ <strong>Important:</strong> Ce lien est valide pendant <strong>1 heure</strong> seulement.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
          </p>
          <p style="color: #3b82f6; font-size: 12px; word-break: break-all; background-color: #eff6ff; padding: 10px; border-radius: 4px;">
            ${process.env.FRONTEND_URL}/reset-password/${resetToken}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #ef4444; font-size: 14px;">
            ⚠️ Si vous n'avez pas demandé cette réinitialisation, ignorez ce message et votre mot de passe restera inchangé.
          </p>
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
            Cordialement,<br/>L'équipe Indebel
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>
      </div>
  `,
  }),

  labelApproved: (prenom, nom, email) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: '🎉 Félicitations! Votre Label Indebel est approuvé',
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Félicitations!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Votre Label Indebel est maintenant actif</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Bonjour ${prenom || nom},</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Nous avons le grand plaisir de vous informer que votre demande de <strong>Label Indebel</strong> a été approuvée avec succès!
          </p>
          
          <!-- Image du label -->
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:label-indebel" alt="Label Indebel" style="width: 120px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
            <p style="color: #16a34a; font-weight: bold; margin: 15px 0 0 0; font-size: 18px;">🏆 Votre Label Indebel Officiel</p>
          </div>
          
          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #16a34a; margin: 0 0 15px 0; font-size: 18px;">🏆 Votre Label Indebel est actif</h3>
            <p style="color: #166534; margin: 0; line-height: 1.6;">
              Votre label apparaît maintenant sur votre profil, dans la sidebar et sur votre profil public. 
              Il témoigne de votre excellence et de votre engagement en tant que professionnel certifié Indebel.
            </p>
          </div>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">✨ Bénéfices de votre label</h3>
            <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Visibilité accrue sur la plateforme</li>
              <li>Badge de certification visible par tous</li>
              <li>Accès à des missions exclusives</li>
              <li>Confiance renforcée des clients</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/freelancer/profile" 
               style="display: inline-block; background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Voir mon profil avec le label
            </a>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>📞 N'hésitez pas à nous contacter</strong> si vous avez des questions sur votre label ou sur les opportunités qui s'offrent à vous.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Félicitations encore une fois pour cette excellente achievement!<br/>
            Cordialement,<br/>L'équipe Indebel
          </p>
        </div>
      </div>
  `,
    attachments: [{
      filename: 'label.png',
      path: path.join(__dirname, '../public/images/label.png'),
      cid: 'label-indebel' // Content ID pour référence dans l'email
    }]
  }),

  labelRejected: (prenom, nom, email, reason = '') => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: '📋 Informations concernant votre demande de Label Indebel',
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📋 Votre demande de label</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Informations importantes pour votre parcours</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Bonjour ${prenom || nom},</h2>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Nous vous remercions sincèrement pour votre intérêt pour le <strong>Label Indebel</strong>. 
            Après examen attentif de votre dossier, nous ne pouvons malheureusement pas approuver votre demande à ce moment.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px; margin: 20px 0;">
            <strong>Ceci n'est pas un refus définitif!</strong> C'est une étape dans votre parcours professionnel, et nous sommes là pour vous aider à atteindre l'excellence.
          </p>
          
          ${reason ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">📝 Points à améliorer</h3>
            <p style="color: #78350f; margin: 0; line-height: 1.6; font-weight: 500;">${reason}</p>
          </div>
          `: ''}
          
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #0ea5e9; margin: 0 0 15px 0;">🚀 Votre checklist pour le Label Indebel</h3>
            <div style="color: #0369a1; line-height: 1.8;">
              <div style="display: flex; align-items: center; margin: 8px 0;">
                <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 24px; margin-right: 12px; font-weight: bold;">1</span>
                <strong>Profil complet</strong> - Remplissez tous les champs de votre profil
              </div>
              <div style="display: flex; align-items: center; margin: 8px 0;">
                <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 24px; margin-right: 12px; font-weight: bold;">2</span>
                <strong>Vérification d'identité</strong> - Validez votre identité avec nos documents
              </div>
              <div style="display: flex; align-items: center; margin: 8px 0;">
                <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 24px; margin-right: 12px; font-weight: bold;">3</span>
                <strong>Missions réussies</strong> - Accumulez de l'expérience avec des missions
              </div>
              <div style="display: flex; align-items: center; margin: 8px 0;">
                <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 24px; margin-right: 12px; font-weight: bold;">4</span>
                <strong>Excellents avis</strong> - Maintenez une note moyenne élevée
              </div>
              <div style="display: flex; align-items: center; margin: 8px 0;">
                <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #e0f2fe; color: #0284c7; text-align: center; line-height: 24px; margin-right: 12px; font-weight: bold;">5</span>
                <strong>Forfait Premium</strong> - Souscrivez à un abonnement adéquat
              </div>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #495057; margin: 0 0 15px 0;">💡 Nos conseils pour réussir</h3>
            <ul style="color: #495057; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Prenez le temps de bien compléter votre profil</li>
              <li>Demandez des avis à vos clients après chaque mission</li>
              <li>Soyez réactif et professionnel dans vos communications</li>
              <li>N'hésitez pas à nous contacter pour des conseils personnalisés</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/freelancer/label/eligibility" 
               style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Vérifier mon éligibilité actuelle
            </a>
          </div>
          
          <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              <strong>🌟 Rappel:</strong> Vous pourrez soumettre une nouvelle demande dès que vous remplirez tous les critères. Nous encourageons votre progression!
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Votre succès est notre succès! Nous sommes là pour vous accompagner.<br/>
            Cordialement,<br/>L'équipe Indebel
          </p>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="color: #495057; margin: 0; font-size: 13px;">
              <strong>📞 Besoin d'aide ?</strong><br/>
              Email: <a href="mailto:contact@indebel.be" style="color: #0ea5e9;">contact@indebel.be</a><br/>
              Nous répondons sous 24h
            </p>
          </div>
        </div>
      </div>
  `,
  }),

  // Notification Admin - Nouvelle demande de vérification
  newVerificationAdmin: (user) => ({
    from: '"Indebel System" <noreply@indebel.be>',
    to: getAdminEmails(),
    subject: `🆕 Nouvelle demande de vérification: ${user.prenom} ${user.nom} `,
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Nouvelle Demande de Vérification</h2>
        <p>Un utilisateur a soumis ses documents pour vérification d'identité.</p>
        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #6366f1;">
          <ul>
            <li><strong>Utilisateur :</strong> ${user.prenom} ${user.nom}</li>
            <li><strong>Email :</strong> ${user.email}</li>
            <li><strong>Type de document :</strong> ${user.type_document?.replace('_', ' ') || 'Non spécifié'}</li>
            <li><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
          </ul>
        </div>
        <p>Veuillez vérifier les documents dans l'interface d'administration.</p>
        <a href="${process.env.FRONTEND_URL}/admin/verifications" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Traiter la demande</a>
      </div>
  `
  }),

  welcomeFreeFreelancer: (prenom, nom, email) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: '🎉 Bienvenue sur Indebel - Forfait Découverte Activé',
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3b82f6; margin: 0;">🎉 Bienvenue ${prenom}!</h1>
      </div>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Votre compte prestataire est prêt. Vous avez été automatiquement inscrit au <strong>Forfait Découverte (Gratuit)</strong>.
      </p>
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">✨ Ce que vous pouvez faire avec votre offre :</h3>
        <ul style="color: #4b5563; line-height: 1.6;">
          <li>✅ Créer un profil complet et attractif</li>
          <li>✅ Postuler à 2 missions par mois</li>
          <li>✅ Recevoir des notifications d'opportunités</li>
        </ul>
      </div>
      <p style="color: #4b5563; font-size: 14px;">
        Pour booster votre visibilité et postuler de manière illimitée, découvrez nos forfaits Premium!
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/freelancer/forfaits" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Voir les forfaits</a>
      </div>
    </div>
      </div>
  `
  }),

  welcomeFreeEmployer: (denomination, email) => ({
    from: '"Indebel" <noreply@indebel.be>',
    to: email,
    subject: '🎉 Bienvenue sur Indebel - Version Gratuite Activée',
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3b82f6; margin: 0;">🎉 Bienvenue sur Indebel!</h1>
      </div>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Bonjour ${denomination}, votre compte recruteur est activé avec l'<strong>Offre Gratuite</strong>.
      </p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">💼 Votre offre inclut :</h3>
        <ul style="color: #4b5563; line-height: 1.6;">
          <li>✅ Publication d'une mission par mois</li>
          <li>✅ Accès à la liste des prestataires (limité)</li>
          <li>✅ Tableau de bord de suivi</li>
        </ul>
      </div>
      <p style="color: #4b5563; font-size: 14px;">
        Besoin de plus de flexibilité ? Découvrez nos options pour publier davantage de missions.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/employer/forfaits" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Gérer mon offre</a>
      </div>
    </div>
      </div>
  `
  }),

  newSupportTicketAdmin: (ticket, user) => ({
    from: '"Indebel System" <noreply@indebel.be>',
    to: getAdminEmails(),
    subject: `🎫 Nouveau ticket support #${ticket.id}:${ticket.sujet} `,
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">🎫 Nouveau Ticket Support</h2>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">
          <p><strong>De :</strong> ${user.prenom} ${user.nom} (${user.email})</p>
          <p><strong>Sujet :</strong> ${ticket.sujet}</p>
          <p><strong>Catégorie :</strong> ${ticket.categorie}</p>
          <p><strong>Priorité :</strong> ${ticket.priorite}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>Message :</h3>
          <p style="white-space: pre-wrap; background: #fff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px;">${ticket.message}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/admin/support/${ticket.id}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Répondre au ticket</a>
      </div>
  `
  }),

  // Notification Admin - Nouvel abonnement
  newSubscriptionAdmin: (user, forfait) => ({
    from: '"Indebel System" <noreply@indebel.be>',
    to: getAdminEmails(),
    subject: `Nouvel abonnement - ${user.prenom || ''} ${user.nom || ''}`.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Nouvel abonnement</h2>
        <p>Un utilisateur vient de souscrire ou renouveler un forfait.</p>
        <ul>
          <li><strong>Utilisateur :</strong> ${user.prenom || ''} ${user.nom || ''}</li>
          <li><strong>Email :</strong> ${user.email || 'Non renseigné'}</li>
          <li><strong>Forfait :</strong> ${forfait?.nom || forfait?.name || 'Non renseigné'}</li>
          <li><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/admin/users" style="display:inline-block;background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;margin-top:15px;">Voir dans l'administration</a>
      </div>
    `
  }),

  // Notification Admin - Action d'un Sous-Admin
  subAdminActionAdmin: (subAdmin, actionMessage) => ({
    from: '"Indebel System" <noreply@indebel.be>',
    to: getAdminEmails(),
    subject: `🔔 Action Sous-Admin : ${subAdmin.prenom || subAdmin.nom || 'Un sous-admin'}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Nouvelle Action Sous-Admin</h2>
        <p>Bonjour Super Admin,</p>
        <p>Le sous-admin <strong>${subAdmin.prenom || ''} ${subAdmin.nom || ''}</strong> (${subAdmin.email}) a effectué l'action suivante sur la plateforme :</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; border-left: 4px solid #4F46E5; margin: 20px 0;">
          <p style="margin: 0; white-space: pre-wrap;">${actionMessage}</p>
        </div>
        <p>Connectez-vous à votre espace <a href="${process.env.FRONTEND_URL}/admin/dashboard" style="color: #4F46E5; text-decoration: none; font-weight: bold;">Super Admin</a> pour plus de détails.</p>
        <p style="margin-top: 30px;">Cordialement,<br/>L'équipe technique Indebel</p>
      </div>
    `
  }),
};

// Send email function
const sendEmail = async (emailConfig) => {
  try {
    console.log('📧 Tentative envoi email à:', emailConfig.to);

    // Envoi direct sans re-vérification systématique


    const info = await transporter.sendMail({
      from: emailConfig.from || '"Indebel" <noreply@indebel.be>',
      ...emailConfig
    });

    console.log('✅ Email envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    console.error('Détails:', error);
    // Ne pas throw pour ne pas bloquer l'application
    return { success: false, error: error.message };
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendEmail, emailTemplates, generateOTP, getAdminEmails };
