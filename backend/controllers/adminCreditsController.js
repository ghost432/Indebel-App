const db = require('../config/database');
const additionalNotifications = require('../services/additionalNotifications');

const executeQuery = async (query, params = []) => {
    const [results] = await db.query(query, params);
    return results;
};

exports.getSettings = async (req, res) => {
    try {
        const settingsKeys = [
            "prix_credit_euro", "credits_gratuits_inscription",
            "cout_devis_manuel", "cout_devis_ia", "cout_documents_freelancer", "cout_candidatures_ia", "cout_vues_missions", "cout_vues_devis", "cout_postulations", "cout_vues_employers",
            "cout_missions_employer", "cout_documents_employer", "cout_demandes_devis", "cout_devis_recus", "cout_candidatures_recues", "cout_vues_freelancers"
        ];
        
        const settings = await executeQuery(`SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (${settingsKeys.map(k => `"${k}"`).join(',')})`);
        
        const config = {
            price: 1.00,
            credits_gratuits_inscription: 5,
            cout_devis_manuel: 1,
            cout_devis_ia: 2,
            cout_documents_freelancer: 1,
            cout_candidatures_ia: 1,
            cout_vues_missions: 1,
            cout_vues_devis: 1,
            cout_postulations: 1,
            cout_vues_employers: 1,
            cout_missions_employer: 1,
            cout_documents_employer: 1,
            cout_demandes_devis: 1,
            cout_devis_recus: 1,
            cout_candidatures_recues: 1,
            cout_vues_freelancers: 1
        };

        settings.forEach(s => {
            if (s.setting_key === 'prix_credit_euro') config.price = parseFloat(s.setting_value);
            else if (s.setting_key === 'credits_gratuits_inscription') config.credits_gratuits_inscription = parseInt(s.setting_value, 10);
            else if (config[s.setting_key] !== undefined) config[s.setting_key] = parseInt(s.setting_value, 10);
        });

        res.json({ success: true, ...config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const payload = req.body;
        
        for (const [key, value] of Object.entries(payload)) {
            if (value !== undefined) {
                const dbKey = key === 'price' ? 'prix_credit_euro' : key;
                await executeQuery(
                    'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    [dbKey, value.toString(), value.toString()]
                );
            }
        }

        res.json({ success: true, message: 'Paramètres mis à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

exports.updateUserBalance = async (req, res) => {
    try {
        const { userId, amount, action, reason } = req.body; // action: 'add' or 'remove'
        const users = await executeQuery('SELECT id, email, prenom, nom, denomination, role, solde_credits FROM users WHERE id = ?', [userId]);
        if (!users.length) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        
        const user = users[0];
        const currentBalance = parseInt(user.solde_credits, 10) || 0;
        const creditAmount = Math.abs(parseInt(amount, 10)) || 0;

        if (creditAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Le montant de crédits doit être un nombre supérieur à 0' });
        }

        const newBalance = action === 'add' ? currentBalance + creditAmount : Math.max(0, currentBalance - creditAmount);
        
        await executeQuery('UPDATE users SET solde_credits = ? WHERE id = ?', [newBalance, userId]);
        
        // Add to history
        const type = action === 'add' ? 'bonus' : 'depense';
        const motif = reason || (action === 'add' ? 'Ajout manuel admin' : 'Débit manuel admin');
        await executeQuery('INSERT INTO historique_credits (user_id, type, montant, description) VALUES (?, ?, ?, ?)', [userId, type, creditAmount, motif]);
        
        // Trigger Email & In-App Notification mentioning L'équipe Indebel
        try {
            await additionalNotifications.notifyCreditBalanceUpdate(user, action, creditAmount, newBalance, motif);
        } catch (notifError) {
            console.error('Erreur lors de l\'envoi de la notification/email de solde:', notifError);
        }

        res.json({ success: true, message: 'Solde mis à jour avec succès', newBalance });
    } catch (error) {
        console.error('Erreur updateUserBalance:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour du solde' });
    }
};

exports.giveFreeCreditsToAll = async (req, res) => {
    try {
        const { amount, updateDefault } = req.body;
        const creditAmount = parseInt(amount, 10);

        if (isNaN(creditAmount) || creditAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Le montant de crédits doit être un nombre supérieur à 0' });
        }

        // 1. Mettre à jour site_settings si demandé ou systématiquement pour la valeur par défaut
        if (updateDefault !== false) {
            await executeQuery(
                'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                ['credits_gratuits_inscription', creditAmount.toString(), creditAmount.toString()]
            );
        }

        // 2. Récupérer tous les utilisateurs (hors admin)
        const users = await executeQuery('SELECT id, email, prenom, nom, denomination, role FROM users WHERE role IN ("employer", "freelancer")');

        if (users.length > 0) {
            // Mettre à jour les soldes
            await executeQuery('UPDATE users SET solde_credits = solde_credits + ? WHERE role IN ("employer", "freelancer")', [creditAmount]);

            // Ajouter dans l'historique de chaque utilisateur
            for (const u of users) {
                await executeQuery(
                    'INSERT INTO historique_credits (user_id, type, montant, description) VALUES (?, "bonus", ?, ?)',
                    [u.id, creditAmount, 'Crédits gratuits offerts par l\'administration Indebel']
                ).catch(err => console.error('Erreur historique_credits mass add:', err));
            }

            // Déclencher les notifications (In-App + Email)
            additionalNotifications.sendMassFreeCreditsNotification(users, creditAmount).catch(err => console.error('Erreur mass credits notif:', err));
        }

        res.json({
            success: true,
            message: `${creditAmount} crédits offerts avec succès à ${users.length} utilisateur(s) !`,
            userCount: users.length
        });
    } catch (error) {
        console.error('Erreur giveFreeCreditsToAll:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'attribution des crédits' });
    }
};

