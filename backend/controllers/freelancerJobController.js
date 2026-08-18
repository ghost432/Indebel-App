const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');

// Créer mission forfait horaire pour prestataire
exports.createJobHourly = async (req, res, next) => {
    try {
        const {
            titre, type_mission, categorie, langues_parlees, description,
            competences, forfait_heure, heures_travail_max, type_facturation,
            adresse_mission, lieu_mission, autre_lieu, date_debut, nombre_independants, urgente
        } = req.body;

        const freelancer_id = req.user.id;

        // Vérifier le forfait du prestataire
        const [userPlan] = await db.query(
            `SELECT f.peut_publier_missions, f.max_missions, 
              u.forfait_date_expiration,
              (SELECT COUNT(*) FROM jobs_freelancer WHERE freelancer_id = ?) as current_missions
       FROM users u
       JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ?`,
            [freelancer_id, freelancer_id]
        );

        if (userPlan.length === 0 || !userPlan[0].peut_publier_missions) {
            return res.status(403).json({
                success: false,
                message: 'Votre forfait ne vous permet pas de recruter des sous-traitants.'
            });
        }

        // Vérifier l'expiration du forfait
        if (userPlan[0].forfait_date_expiration && new Date(userPlan[0].forfait_date_expiration) < new Date()) {
            return res.status(403).json({
                success: false,
                expired: true,
                message: 'Votre forfait a expiré. Veuillez le renouveler pour continuer à recruter.'
            });
        }

        // Vérifier la limite
        if (userPlan[0].max_missions !== null && userPlan[0].current_missions >= userPlan[0].max_missions) {
            return res.status(403).json({
                success: false,
                message: `Vous avez atteint la limite de ${userPlan[0].max_missions} recrutements pour votre forfait.`
            });
        }

        const [result] = await db.query(
            `INSERT INTO jobs_freelancer (
        freelancer_id, titre, type_mission, secteur, langues_parlees,
        description, competences_requises, taux_horaire, heures_estimees,
        type_facturation, localisation, ville_mission, lieu_mission, autre_lieu,
        date_debut, nombre_independants, urgente, type_forfait, statut,
        date_fermeture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`,
            [
                freelancer_id, titre, type_mission, categorie, JSON.stringify(langues_parlees),
                description, JSON.stringify(competences), forfait_heure, heures_travail_max,
                type_facturation, adresse_mission, adresse_mission, lieu_mission, autre_lieu || null,
                date_debut, nombre_independants, urgente || false, 'hourly', 'en_attente_validation'
            ]
        );

        // Notifications
        try {
            const additionalNotif = require('../services/additionalNotifications');
            await additionalNotif.notifyMissionCreation(
                { titre, type: 'Recrutement Horaire (Prestataire)', budget: `${forfait_heure}€/h` },
                req.user,
                true // isFreelancerJob
            );
        } catch (notifError) {
            console.error('Erreur notification recrutement prestataire:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Demande de recrutement créée avec succès',
            data: { id: result.insertId }
        });
    } catch (error) {
        next(error);
    }
};

// Créer mission forfait fixe pour prestataire
exports.createJobFixed = async (req, res, next) => {
    try {
        const {
            titre, type_mission, categorie, langues_parlees, description,
            competences, forfait_mission, temps_max_estime, type_facturation,
            adresse_mission, lieu_mission, autre_lieu, date_debut, nombre_independants, urgente
        } = req.body;

        const freelancer_id = req.user.id;

        // Vérifier le forfait
        const [userPlan] = await db.query(
            `SELECT f.peut_publier_missions, f.max_missions, 
              u.forfait_date_expiration,
              (SELECT COUNT(*) FROM jobs_freelancer WHERE freelancer_id = ?) as current_missions
       FROM users u
       JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ?`,
            [freelancer_id, freelancer_id]
        );

        if (userPlan.length === 0 || !userPlan[0].peut_publier_missions) {
            return res.status(403).json({
                success: false,
                message: 'Votre forfait ne vous permet pas de recruter des sous-traitants.'
            });
        }

        if (userPlan[0].forfait_date_expiration && new Date(userPlan[0].forfait_date_expiration) < new Date()) {
            return res.status(403).json({
                success: false,
                expired: true,
                message: 'Votre forfait a expiré. Veuillez le renouveler pour continuer à recruter.'
            });
        }

        if (userPlan[0].max_missions !== null && userPlan[0].current_missions >= userPlan[0].max_missions) {
            return res.status(403).json({
                success: false,
                message: `Vous avez atteint la limite de ${userPlan[0].max_missions} recrutements pour votre forfait.`
            });
        }

        const [result] = await db.query(
            `INSERT INTO jobs_freelancer (
        freelancer_id, titre, type_mission, secteur, langues_parlees,
        description, competences_requises, budget_fixe, duree,
        type_facturation, localisation, ville_mission, lieu_mission, autre_lieu,
        date_debut, nombre_independants, urgente, type_forfait, statut,
        date_fermeture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`,
            [
                freelancer_id, titre, type_mission, categorie, JSON.stringify(langues_parlees),
                description, JSON.stringify(competences), forfait_mission, temps_max_estime,
                type_facturation, adresse_mission, adresse_mission, lieu_mission, autre_lieu || null,
                date_debut, nombre_independants, urgente || false, 'fixed', 'en_attente_validation'
            ]
        );

        // Notifications
        try {
            const additionalNotif = require('../services/additionalNotifications');
            await additionalNotif.notifyMissionCreation(
                { titre, type: 'Recrutement Forfait (Prestataire)', budget: `${forfait_mission}€` },
                req.user,
                true // isFreelancerJob
            );
        } catch (notifError) {
            console.error('Erreur notification recrutement prestataire:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Demande de recrutement créée avec succès',
            data: { id: result.insertId }
        });
    } catch (error) {
        next(error);
    }
};

// Récupérer les recrutements d'un prestataire
exports.getMyJobs = async (req, res, next) => {
    try {
        const freelancer_id = req.user.id;
        const [jobs] = await db.query(
            `SELECT * FROM jobs_freelancer WHERE freelancer_id = ? ORDER BY date_creation DESC`,
            [freelancer_id]
        );
        res.json({ success: true, data: jobs });
    } catch (error) {
        next(error);
    }
};

// Récupérer tous les recrutements prestataires (Admin)
exports.getAllFreelancerJobs = async (req, res, next) => {
    try {
        const [jobs] = await db.query(`
      SELECT j.*, u.nom, u.prenom, u.email, u.denomination
      FROM jobs_freelancer j
      JOIN users u ON j.freelancer_id = u.id
      ORDER BY j.date_creation DESC
    `);
        res.json({ success: true, data: jobs });
    } catch (error) {
        next(error);
    }
};

// Mettre à jour le statut (Admin)
exports.updateJobStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { statut, motif_refus } = req.body;

        const [job] = await db.query('SELECT j.*, u.email, u.prenom, u.nom FROM jobs_freelancer j JOIN users u ON j.freelancer_id = u.id WHERE j.id = ?', [id]);
        if (job.length === 0) return res.status(404).json({ success: false, message: 'Recrutement non trouvé' });

        await db.query('UPDATE jobs_freelancer SET statut = ? WHERE id = ?', [statut, id]);

        // Notification prestataire
        const additionalNotif = require('../services/additionalNotifications');
        await additionalNotif.notifyMissionStatusChange(
            { titre: job[0].titre },
            job[0],
            statut,
            id,
            job[0].type_forfait,
            true // isFreelancerJob
        );

        res.json({ success: true, message: 'Statut mis à jour' });
    } catch (error) {
        next(error);
    }
};

// Fermer un recrutement (Prestataire lui-même)
exports.closeJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const freelancer_id = req.user.id;

        // Vérifier que le recrutement appartient au prestataire
        const [job] = await db.query(
            'SELECT id, statut FROM jobs_freelancer WHERE id = ? AND freelancer_id = ?',
            [id, freelancer_id]
        );

        if (job.length === 0) {
            return res.status(404).json({ success: false, message: 'Recrutement non trouvé ou non autorisé' });
        }

        if (job[0].statut === 'ferme') {
            return res.status(400).json({ success: false, message: 'Le recrutement est déjà fermé' });
        }

        await db.query('UPDATE jobs_freelancer SET statut = "ferme" WHERE id = ?', [id]);

        res.json({ success: true, message: 'Recrutement fermé avec succès' });
    } catch (error) {
        next(error);
    }
};

