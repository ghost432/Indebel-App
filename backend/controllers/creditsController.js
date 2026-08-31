const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');
const additionalNotifications = require('../services/additionalNotifications');

const executeQuery = async (query, params = []) => {
    const [results] = await db.query(query, params);
    return results;
};

exports.getCreditsBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await executeQuery('SELECT solde_credits FROM users WHERE id = ?', [userId]);
        
        if (!users.length) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        }
        
        res.json({ success: true, solde: users[0].solde_credits });
    } catch (error) {
        console.error('Erreur getCreditsBalance:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

exports.getHistorique = async (req, res) => {
    try {
        const userId = req.user.id;
        const historique = await executeQuery('SELECT * FROM historique_credits WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json({ success: true, historique });
    } catch (error) {
        console.error('Erreur getHistorique:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const FactureService = require('../services/factureService');

exports.buyCredits = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pack_amount } = req.body; // e.g., 10, 50, 100

        if (!pack_amount || pack_amount <= 0) {
            return res.status(400).json({ success: false, message: 'Quantité invalide' });
        }

        // Get user role to direct to appropriate dashboard
        const users = await executeQuery('SELECT role FROM users WHERE id = ?', [userId]);
        const userRole = users.length > 0 ? users[0].role : 'freelancer';
        const frontendUrl = (process.env.FRONTEND_URL || 'https://pro.indebel.be').replace(/\/$/, '');
        const dashboardPath = userRole === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard';

        // Get the price per credit from settings
        let pricePerCreditEur = 1.00;
        try {
            const settings = await executeQuery('SELECT setting_value FROM site_settings WHERE setting_key = "prix_credit_euro"');
            if (settings.length > 0) {
                pricePerCreditEur = parseFloat(settings[0].setting_value);
            }
        } catch (e) {
            console.error('Error fetching credit price setting:', e);
        }

        const totalHT = pricePerCreditEur * pack_amount;
        const tva = totalHT * 0.21;
        const totalTTC = totalHT + tva;

        // Create Stripe checkout session with HT price + 21% TVA
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Pack de ${pack_amount} Crédits Indebel (${totalHT.toFixed(2)}€ HT)`,
                            description: 'Achat de crédits pour débloquer les fonctionnalités et réponses de devis sur Indebel.',
                        },
                        unit_amount: Math.round(totalHT * 100),
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `TVA (21%) - ${tva.toFixed(2)}€`,
                            description: `Taxe sur la valeur ajoutée (21% de ${totalHT.toFixed(2)}€ HT = ${tva.toFixed(2)}€)`,
                        },
                        unit_amount: Math.round(tva * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${frontendUrl}${dashboardPath}?payment_success=true&credits=${pack_amount}`,
            cancel_url: `${frontendUrl}/${userRole}/credits?canceled=true`,
            metadata: {
                userId: userId.toString(),
                pack_amount: pack_amount.toString(),
                type: 'credit_purchase'
            },
        });

        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Erreur buyCredits:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création de la session de paiement' });
    }
};

exports.consumeCredits = async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, amount: customAmount } = req.body;

        // Fetch current user credits
        const users = await executeQuery('SELECT solde_credits, role FROM users WHERE id = ?', [userId]);
        if (!users.length) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        }

        const user = users[0];
        let cost = 1;

        const actionSettingMap = {
            'view_freelancers_list': 'cout_vues_freelancers',
            'view_employers_list': 'cout_vues_employers',
            'view_missions_list': 'cout_vues_missions',
            'view_mission_detail': 'cout_vues_missions',
            'view_devis_list': 'cout_vues_devis',
            'view_devis_disponibles': 'cout_vues_devis',
            'view_devis_detail': 'cout_vues_devis',
            'view_demandes_devis': 'cout_demandes_devis',
            'view_devis_recus': 'cout_devis_recus',
            'generate_devis_ia': 'cout_devis_ia',
            'generate_candidature_ia': 'cout_candidatures_ia',
            'publish_mission': 'cout_missions_employer'
        };

        const actionLabelMap = {
            'view_freelancers_list': 'Consultation de la liste des prestataires',
            'view_employers_list': 'Consultation de la liste des recruteurs',
            'view_missions_list': 'Consultation de la liste des missions',
            'view_mission_detail': 'Consultation du détail d\'une mission',
            'view_devis_list': 'Consultation des devis disponibles',
            'view_devis_disponibles': 'Consultation des devis disponibles',
            'view_devis_detail': 'Consultation du détail d\'un devis',
            'view_demandes_devis': 'Consultation des demandes de devis',
            'view_devis_recus': 'Consultation des devis reçus',
            'generate_devis_ia': 'Génération de devis par IA',
            'generate_candidature_ia': 'Génération de candidature par IA',
            'publish_mission': 'Publication d\'une mission'
        };

        if (customAmount !== undefined && customAmount !== null && !isNaN(parseInt(customAmount, 10))) {
            cost = parseInt(customAmount, 10);
        } else if (actionSettingMap[action]) {
            const dbKey = actionSettingMap[action];
            const settings = await executeQuery('SELECT setting_value FROM site_settings WHERE setting_key = ?', [dbKey]);
            if (settings.length > 0 && settings[0].setting_value !== undefined && settings[0].setting_value !== null) {
                cost = parseInt(settings[0].setting_value, 10);
            }
        }

        if (user.solde_credits < cost) {
            return res.status(403).json({
                success: false,
                code: 'INSUFFICIENT_CREDITS',
                message: `Solde de crédits insuffisant (${user.solde_credits} crédit(s) disponibles, ${cost} nécessaire(s)).`
            });
        }

        // Deduct credits only if cost > 0
        if (cost > 0) {
            await executeQuery('UPDATE users SET solde_credits = solde_credits - ? WHERE id = ?', [cost, userId]);
        }

        // Record in credit history
        try {
            await executeQuery(
                'INSERT INTO historique_credits (user_id, type, credits, motif) VALUES (?, ?, ?, ?)',
                [userId, cost > 0 ? 'utilisation' : 'gratuit', -cost, actionLabelMap[action] || action]
            );
        } catch (histErr) {
            console.error('Erreur insertion historique_credits consume:', histErr);
        }

        const newBalance = user.solde_credits - cost;
        res.json({
            success: true,
            message: cost === 0 ? 'Action gratuite autorisée' : 'Crédits déduits avec succès',
            deducted: cost,
            solde: newBalance,
            newBalance
        });
    } catch (error) {
        console.error('Erreur consumeCredits:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la déduction des crédits' });
    }
};

exports.webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        const body = req.rawBody || req.body;
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.metadata && session.metadata.type === 'credit_purchase') {
            const userId = parseInt(session.metadata.userId);
            const amount = parseInt(session.metadata.pack_amount);

            try {
                // 1. Give credits to user
                await executeQuery('UPDATE users SET solde_credits = solde_credits + ? WHERE id = ?', [amount, userId]);
                
                // 2. Log transaction in credit history
                await executeQuery(
                    'INSERT INTO historique_credits (user_id, type, montant, description) VALUES (?, "achat", ?, ?)', 
                    [userId, amount, `Achat de Pack de ${amount} Crédits Indebel via Stripe`]
                );
                console.log(`✅ ${amount} credits added to user ${userId}`);

                // 3. Calculate HT price and generate invoice + send to Falco
                let pricePerCreditEur = 1.00;
                try {
                    const settings = await executeQuery('SELECT setting_value FROM site_settings WHERE setting_key = "prix_credit_euro"');
                    if (settings.length > 0) {
                        pricePerCreditEur = parseFloat(settings[0].setting_value);
                    }
                } catch (e) {}

                const totalHT = pricePerCreditEur * amount;

                try {
                    const connection = await db.promise().getConnection();
                    await FactureService.creerFactureCredits(connection, userId, amount, totalHT);
                    connection.release();
                    console.log(`✅ Facture de crédits créée et transmise à Falco pour l'utilisateur ${userId}`);
                } catch (factureError) {
                    console.error('❌ Erreur lors de la création/transmission de la facture de crédits:', factureError);
                }

                // 4. Send notification to user
                try {
                    await executeQuery(
                        `INSERT INTO notifications (user_id, titre, message, type, lien)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            userId,
                            '🎉 Crédits crédités !',
                            `Votre achat de ${amount} crédits a été validé avec succès. Votre nouveau solde est disponible.`,
                            'success',
                            '/credits'
                        ]
                    );
                } catch (notifErr) {
                    console.error('Erreur création notification crédit:', notifErr);
                }

                // 5. Send notification and email to admins
                try {
                    await additionalNotifications.notifyAdminsNewCreditPurchase(userId, amount, totalHT);
                } catch (adminNotifErr) {
                    console.error('Erreur notification admin achat crédits:', adminNotifErr);
                }

            } catch (error) {
                console.error('Failed to process credit purchase webhook:', error);
            }
        }
    }

    res.json({ received: true });
};
