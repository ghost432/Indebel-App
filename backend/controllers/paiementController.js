const db = require('../config/database');
const { sendEmail } = require('../config/email');
const FactureService = require('../services/factureService');

const calculateExpirationDate = (forfait) => {
  let dureeMois = forfait.duree_abonnement_mois;
  if (dureeMois == null) {
    dureeMois = forfait.duree === 'annuel' ? 12
      : forfait.duree === 'semestriel' ? 6
      : forfait.duree === 'trimestriel' ? 3
      : 1;
  }
  
  if (parseFloat(forfait.prix_mensuel) === 0 && forfait.duree === 'mensuel') {
      return null;
  }

  if (dureeMois > 0) {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + dureeMois);
    return expirationDate.toISOString().split('T')[0];
  }
  return null;
};

// Initialiser Stripe uniquement si la clé est configurée
let stripe = null;
let stripeConfigured = false;

if (process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== 'your-stripe-secret-key' &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    stripeConfigured = true;

    // Vérifier le type de clé (test ou production)
    const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    const isProdMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');

    if (isTestMode) {
      console.log('✅ Stripe configuré avec succès (MODE TEST)');
    } else if (isProdMode) {
      console.log('✅ Stripe configuré avec succès (MODE PRODUCTION)');
    } else {
      console.log('✅ Stripe configuré avec succès');
    }

    // Log de la clé publique si disponible
    if (process.env.STRIPE_PUBLISHABLE_KEY) {
      console.log('✅ Clé publique Stripe configurée');
    } else {
      console.warn('⚠️  STRIPE_PUBLISHABLE_KEY non configurée (nécessaire pour le frontend)');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation Stripe:', error.message);
    stripeConfigured = false;
  }
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY non configurée - Mode simulation activé');
  stripeConfigured = false;
}

// Obtenir la configuration publique Stripe (pour le frontend)
exports.getStripeConfig = (req, res) => {
  res.json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      isConfigured: stripeConfigured,
      isTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
      isProdMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') || false
    }
  });
};

// Créer une session de paiement Stripe
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { forfait_id } = req.body;
    const user_id = req.user.id;

    // Récupérer l'email et le rôle de l'utilisateur
    const [users] = await db.query(
      'SELECT email, role FROM users WHERE id = ?',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userEmail = users[0].email;
    const userRole = users[0].role;

    // Récupérer le forfait
    const [forfaits] = await db.query(
      'SELECT * FROM forfaits WHERE id = ? AND actif = TRUE',
      [forfait_id]
    );

    if (forfaits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forfait non trouvé'
      });
    }

    const forfait = forfaits[0];

    const expirationDate = calculateExpirationDate(forfait);

    // Si le forfait est gratuit, activer directement sans passer par Stripe
    if (parseFloat(forfait.prix_mensuel) === 0) {
      await db.query(
        `UPDATE users SET
          forfait_id = ?,
          forfait_date_debut = CURDATE(),
          forfait_date_expiration = ?,
          forfait_statut = 'actif'
        WHERE id = ?`,
        [forfait_id, expirationDate, user_id]
      );

      // Notifier les admins de l'abonnement gratuit
      try {
        const additionalNotif = require('../services/additionalNotifications');
        await additionalNotif.notifyAdminsNewSubscription(
          { ...users[0], id: user_id, prenom: users[0].prenom || '', nom: users[0].nom || '', denomination: users[0].denomination || '' },
          forfait
        );
      } catch (adminNotifError) {
        console.error('Erreur notification admin abonnement gratuit:', adminNotifError);
      }

      return res.json({
        success: true,
        is_free: true,
        message: 'Forfait gratuit activé avec succès'
      });
    }

    // MODE SIMULATION : Si Stripe n'est pas configuré, activer directement en mode test
    if (!stripeConfigured || process.env.PAYMENT_MODE === 'simulation') {
      console.log('🧪 MODE SIMULATION : Activation forfait sans paiement réel');

      await db.query(
        `UPDATE users SET
          forfait_id = ?,
          forfait_date_debut = CURDATE(),
          forfait_date_expiration = ?,
          forfait_statut = 'actif'
        WHERE id = ?`,
        [forfait_id, expirationDate, user_id]
      );

      // Envoyer email de confirmation
      try {
        await sendEmail({
          to: userEmail,
          subject: `Forfait ${forfait.nom} activé (MODE TEST)`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10B981;">✅ Forfait activé avec succès</h2>
              <p>Bonjour,</p>
              <p>Votre forfait <strong>${forfait.nom}</strong> a été activé en mode test.</p>
              <p><strong>⚠️ MODE SIMULATION :</strong> Aucun paiement réel n'a été effectué.</p>
              <p>Prix : ${forfait.prix_mensuel}€/mois</p>
              <p>Date d'activation : ${new Date().toLocaleDateString('fr-FR')}</p>
              <p>Cordialement,<br>L'équipe Indebel</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }

      // Notifier les admins de l'abonnement
      try {
        const additionalNotif = require('../services/additionalNotifications');
        await additionalNotif.notifyAdminsNewSubscription(
          { ...users[0], id: user_id, prenom: users[0].prenom || '', nom: users[0].nom || '', denomination: users[0].denomination || '' },
          forfait
        );
      } catch (adminNotifError) {
        console.error('Erreur notification admin abonnement simulation:', adminNotifError);
      }

      return res.json({
        success: true,
        is_free: false,
        simulation_mode: true,
        message: `Forfait ${forfait.nom} activé (MODE TEST - Aucun paiement réel effectué)`,
        redirect_url: `${process.env.FRONTEND_URL}/payment/success?success=true&simulation=true`
      });
    }

    // Cette vérification ne devrait plus être nécessaire car on a le mode simulation ci-dessus

    // Créer une session de paiement Stripe pour les forfaits payants
    // Timeout réduit à 10 secondes pour éviter les longues attentes
    try {
      // Calculer les montants
      const prixHT = parseFloat(forfait.prix_mensuel);
      const tva = prixHT * 0.21;
      const total = prixHT + tva;
      const totalTTC = total.toFixed(2);

      const session = await Promise.race([
        stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: userEmail,
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `${forfait.nom} - ${totalTTC}€ TTC (${prixHT}€ HT)`,
                  description: forfait.description || `Forfait ${forfait.nom} - Prix total TTC: ${totalTTC}€`,
                },
                // Prix HT
                unit_amount: Math.round(prixHT * 100),
              },
              quantity: 1,
            },
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `TVA (21%) - ${tva.toFixed(2)}€`,
                  description: `Taxe sur la valeur ajoutée (21% de ${prixHT}€ HT = ${tva.toFixed(2)}€)`,
                },
                // TVA calculée : 21% du prix HT
                unit_amount: Math.round(tva * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/payment/success?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/${userRole}/forfaits?cancelled=true`,
          metadata: {
            user_id: user_id.toString(),
            forfait_id: forfait_id.toString(),
            user_email: userEmail,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('STRIPE_TIMEOUT')), 10000)
        )
      ]);

      return res.json({
        success: true,
        is_free: false,
        session_id: session.id,
        session_url: session.url
      });
    } catch (stripeError) {
      console.error('❌ Erreur Stripe, basculement en mode simulation:', stripeError.message);

      // FALLBACK: Activer en mode simulation si Stripe échoue
      await db.query(
        `UPDATE users SET
          forfait_id = ?,
          forfait_date_debut = CURDATE(),
          forfait_date_expiration = ?,
          forfait_statut = 'actif'
        WHERE id = ?`,
        [forfait_id, expirationDate, user_id]
      );

      // Récupérer les infos complètes de l'utilisateur
      const [userInfo] = await db.query(
        'SELECT prenom, nom, denomination, telephone, role FROM users WHERE id = ?',
        [user_id]
      );
      const userName = userInfo[0].denomination || `${userInfo[0].prenom} ${userInfo[0].nom}`;
      const userPhone = userInfo[0].telephone || 'Non renseigné';

      // Envoyer email de confirmation à l'utilisateur
      try {
        await sendEmail({
          to: userEmail,
          subject: `Forfait ${forfait.nom} activé`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10B981;">✅ Forfait activé avec succès</h2>
              <p>Bonjour,</p>
              <p>Votre forfait <strong>${forfait.nom}</strong> a été activé.</p>
              <p><strong>⚠️ Note :</strong> Le paiement en ligne a rencontré un problème technique. Votre forfait a été activé temporairement.</p>
              <p>Prix : ${forfait.prix_mensuel}€/mois</p>
              <p>Date d'activation : ${new Date().toLocaleDateString('fr-FR')}</p>
              <p>Un administrateur vous contactera prochainement pour finaliser le paiement.</p>
              <p>Cordialement,<br>L'équipe Indebel</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Erreur envoi email utilisateur:', emailError);
      }

      // Envoyer email à l'admin
      try {
        await sendEmail({
          to: 'noreply@indebel.be',
          subject: `⚠️ Forfait activé SANS paiement - ${userName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #F59E0B;">⚠️ Forfait activé sans paiement</h2>
              <p>Bonjour Admin,</p>
              <p>Un forfait a été activé automatiquement en mode fallback (Stripe a échoué).</p>
              
              <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                <h3 style="margin-top: 0; color: #92400E;">Informations du compte</h3>
                <p style="margin: 5px 0;"><strong>Nom:</strong> ${userName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
                <p style="margin: 5px 0;"><strong>Téléphone:</strong> ${userPhone}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> ${userRole}</p>
              </div>
              
              <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1E40AF;">Détails du forfait</h3>
                <p style="margin: 5px 0;"><strong>Forfait:</strong> ${forfait.nom}</p>
                <p style="margin: 5px 0;"><strong>Prix:</strong> ${forfait.prix_mensuel}€/mois</p>
                <p style="margin: 5px 0;"><strong>Date d'activation:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              
              <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #991B1B;">Motif</h3>
                <p style="margin: 5px 0;"><strong>Raison:</strong> Erreur de connexion à Stripe</p>
                <p style="margin: 5px 0;"><strong>Message d'erreur:</strong> ${stripeError.message}</p>
              </div>
              
              <p style="color: #DC2626; font-weight: bold;">⚠️ Action requise : Contactez l'utilisateur pour finaliser le paiement.</p>
              
              <p>Cordialement,<br>Système Indebel</p>
            </div>
          `
        });
        console.log('✅ Email admin envoyé pour forfait sans paiement');
      } catch (adminEmailError) {
        console.error('❌ Erreur envoi email admin:', adminEmailError);
      }

      // Créer notification pour l'admin
      try {
        const [admins] = await db.query(
          "SELECT id FROM users WHERE role = 'admin'"
        );

        for (const admin of admins) {
          await db.query(
            `INSERT INTO notifications (user_id, titre, message, type)
             VALUES (?, ?, ?, ?)`,
            [
              admin.id,
              '⚠️ Forfait activé sans paiement',
              `${userName} (${userEmail}) a activé le forfait ${forfait.nom} (${forfait.prix_mensuel}€/mois) sans paiement. Stripe a échoué. Contact requis.`,
              'demande'
            ]
          );
        }
        console.log('✅ Notification admin créée');
      } catch (notifError) {
        console.error('❌ Erreur création notification admin:', notifError);
      }

      return res.json({
        success: true,
        is_free: false,
        simulation_mode: true,
        fallback: true,
        message: `Forfait ${forfait.nom} activé. Le paiement sera traité ultérieurement.`,
        redirect_url: `${process.env.FRONTEND_URL}/payment/success?success=true&fallback=true`
      });
    }
  } catch (error) {
    console.error('❌ Erreur générale création paiement:', error);

    // Erreur générique
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la création de la session de paiement.',
      error: error.message,
      code: 'PAYMENT_ERROR'
    });
  }
};

// Webhook Stripe pour recevoir les confirmations de paiement
exports.stripeWebhook = async (req, res) => {
  if (!stripe) {
    console.warn('⚠️  Webhook Stripe appelé mais Stripe n\'est pas configuré');
    return res.status(503).json({ error: 'Service non disponible' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur webhook signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer l'événement
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Activer le forfait pour l'utilisateur
      try {
        const user_id = parseInt(session.metadata.user_id);
        const forfait_id = parseInt(session.metadata.forfait_id);
        const user_email = session.metadata.user_email;

        console.log('✅ Paiement confirmé:', { user_id, forfait_id, session_id: session.id });

        // Récupérer les informations du forfait
        const [forfaits] = await db.query(
          'SELECT nom, prix_mensuel FROM forfaits WHERE id = ?',
          [forfait_id]
        );

        // Récupérer les informations de l'utilisateur
        const [users] = await db.query(
          'SELECT prenom, nom, denomination, email, role FROM users WHERE id = ?',
          [user_id]
        );

        if (forfaits.length === 0 || users.length === 0) {
          throw new Error('Forfait ou utilisateur non trouvé');
        }

        const forfait = forfaits[0];
        const user = users[0];
        const userName = user.denomination || `${user.prenom} ${user.nom}`;
        const userRole = user.role; // employer ou freelancer

        const expirationDate = calculateExpirationDate(forfait);

        // Activer le forfait
        await db.query(
          `UPDATE users SET
            forfait_id = ?,
            forfait_date_debut = CURDATE(),
            forfait_date_expiration = ?,
            forfait_statut = 'actif'
          WHERE id = ?`,
          [forfait_id, expirationDate, user_id]
        );

        // Générer la facture pour les forfaits payants
        try {
          const connection = await db.getConnection();
          await FactureService.creerFacture(
            connection,
            user_id,
            forfait_id,
            new Date(), // date_souscription
            expirationDate // date_expiration
          );
          connection.release();
          console.log('✅ Facture générée pour l\'utilisateur', user_id);
        } catch (factureError) {
          console.error('❌ Erreur lors de la génération de la facture:', factureError);
          // Ne pas bloquer le processus si la facture échoue
        }

        // Create notification for user
        await db.query(
          `INSERT INTO notifications (user_id, titre, message, type, lien)
           VALUES (?, ?, ?, ?, ?)`,
          [
            user_id,
            '✅ Forfait activé',
            'Votre paiement a été confirmé et votre forfait est maintenant actif !',
            'success',
            `/${userRole}/forfaits`
          ]
        );

        // NOUVEAU: Notifier les admins de l'abonnement
        try {
          const additionalNotif = require('../services/additionalNotifications');
          await additionalNotif.notifyAdminsNewSubscription(
            { ...user, id: user_id },
            forfait
          );
        } catch (adminNotifError) {
          console.error('Erreur notification admin abonnement:', adminNotifError);
        }

        // Envoyer un email de confirmation
        try {
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">🎉 Paiement confirmé !</h1>
              </div>
              
              <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; color: #333;">Bonjour <strong>${userName}</strong>,</p>
                
                <p style="font-size: 16px; color: #333;">
                  Nous avons bien reçu votre paiement pour le forfait <strong>${forfait.nom}</strong>.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <h3 style="margin-top: 0; color: #667eea;">Détails du forfait</h3>
                  <p style="margin: 5px 0;"><strong>Forfait :</strong> ${forfait.nom}</p>
                  <p style="margin: 5px 0;"><strong>Prix :</strong> ${forfait.prix_mensuel}€</p>
                  <p style="margin: 5px 0;"><strong>Statut :</strong> <span style="color: #10b981; font-weight: bold;">✅ Actif</span></p>
                  <p style="margin: 5px 0;"><strong>Date d'activation :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                
                <p style="font-size: 16px; color: #333;">
                  Votre forfait est maintenant actif et vous pouvez profiter de toutes ses fonctionnalités !
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/${userRole}/forfaits" 
                     style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Voir mon forfait
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #666;">
                  Si vous avez des questions, n'hésitez pas à nous contacter.
                </p>
                
                <p style="font-size: 14px; color: #666;">
                  Cordialement,<br>
                  <strong>L'équipe Indebel</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
              </div>
            </div>
          `;

          await sendEmail({
            to: user.email,
            subject: 'Confirmation de paiement - Forfait activé',
            html: emailContent
          });

          console.log('✅ Email de confirmation envoyé à:', user.email);
        } catch (emailError) {
          console.error('❌ Erreur envoi email:', emailError);
          // Ne pas bloquer si l'email échoue
        }

        console.log('✅ Forfait activé pour user_id:', user_id);
      } catch (error) {
        console.error('❌ Erreur activation forfait:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      console.log('❌ Paiement échoué:', event.data.object);
      break;

    default:
      console.log(`Type d'événement non géré: ${event.type}`);
  }

  res.json({ received: true });
};

// Vérifier le statut d'une session
exports.checkSessionStatus = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Le système de paiement n\'est pas configuré'
      });
    }

    const { session_id } = req.params;

    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.json({
      success: true,
      data: {
        payment_status: session.payment_status,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Erreur récupération session:', error);
    next(error);
  }
};

module.exports = exports;
