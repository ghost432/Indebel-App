const db = require('../config/db');
const { sendEmail, getAdminEmails } = require('../config/email');

// Fonction helper pour matcher les freelancers qualifiés
const matchFreelancersForDemande = async (demandeId) => {
  try {
    const [demande] = await db.query(
      'SELECT * FROM demandes_devis WHERE id = ?',
      [demandeId]
    );

    if (!demande || demande.length === 0) {
      throw new Error('Demande introuvable');
    }

    const demandeData = demande[0];

    // Rechercher les freelancers avec compétences correspondantes
    const [freelancers] = await db.query(`
      SELECT DISTINCT u.id, u.nom, u.prenom, u.email, u.telephone,
             fp.competences, fp.secteurs_activite, fp.ville as freelancer_ville
      FROM users u
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      WHERE u.role = 'freelancer' 
        AND u.statut = 'active'
        AND fp.competences IS NOT NULL
      LIMIT 50
    `);

    // Scoring des freelancers
    const scoredFreelancers = freelancers.map(freelancer => {
      let score = 0;

      // Parse competences et secteurs
      const competences = freelancer.competences ? JSON.parse(freelancer.competences) : [];
      const secteurs = freelancer.secteurs_activite ? JSON.parse(freelancer.secteurs_activite) : [];

      // Match par catégorie/secteur (poids 30%)
      if (demandeData.type_travaux && secteurs.includes(demandeData.type_travaux)) {
        score += 30;
      }

      // Match par catégorie secondaire (poids 20%)
      if (demandeData.categorie && secteurs.includes(demandeData.categorie)) {
        score += 20;
      }

      // Match par région (poids 25%)
      if (demandeData.region && freelancer.freelancer_ville) {
        if (freelancer.freelancer_ville.toLowerCase().includes(demandeData.region.toLowerCase()) ||
          demandeData.region.toLowerCase().includes(freelancer.freelancer_ville.toLowerCase())) {
          score += 25;
        }
      }

      // Match par ville exacte (poids 25%)
      if (demandeData.ville && freelancer.freelancer_ville) {
        if (freelancer.freelancer_ville.toLowerCase() === demandeData.ville.toLowerCase()) {
          score += 25;
        }
      }

      return {
        ...freelancer,
        score
      };
    });

    // Trier par score décroissant et garder les 20 meilleurs
    const matchedFreelancers = scoredFreelancers
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return { matchedFreelancers, demandeData };

  } catch (error) {
    console.error('Erreur matching freelancers:', error);
    throw error;
  }
};

// Créer une demande de devis (public)
exports.createDemandeDevis = async (req, res) => {
  try {
    const {
      type_travaux,
      categorie,
      description,
      urgence,
      adresse,
      code_postal,
      ville,
      region,
      prenom,
      nom,
      email,
      telephone,
      date_souhaite,
      heure_souhaite,
      budget_estime,
      details_complementaires,
      fichiers_joints
    } = req.body;

    // Validation des champs requis
    if (!type_travaux || !description || !adresse || !code_postal || !ville || !region || !prenom || !nom || !email || !telephone) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Insertion dans la base de données
    const [result] = await db.query(
      `INSERT INTO demandes_devis 
       (type_travaux, categorie, description, urgence, adresse, code_postal, ville, region,
        prenom, nom, email, telephone, date_souhaite, heure_souhaite, budget_estime, details_complementaires, 
        fichiers_joints, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')`,
      [
        type_travaux,
        categorie || null,
        description,
        urgence || 'normal',
        adresse,
        code_postal,
        ville,
        region,
        prenom,
        nom,
        email,
        telephone,
        date_souhaite || null,
        heure_souhaite || null,
        budget_estime || null,
        details_complementaires || null,
        fichiers_joints ? JSON.stringify(fichiers_joints) : null
      ]
    );

    // Envoyer email de confirmation au client
    try {
      await sendEmail({
        to: email,
        subject: '✅ Votre demande de devis a été reçue - Indebel',
        text: `Bonjour ${prenom} ${nom},\n\nNous avons bien reçu votre demande de devis pour: ${type_travaux}\n\nLocalisation: ${adresse}, ${code_postal} ${ville}\n\nNotre équipe va examiner votre demande et la publier, des prestataires pourront vous contacter en envoyant des devis pour votre demande.\n\nNuméro de demande: #${result.insertId}\n\nCordialement,\nL'équipe Indebel`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Demande reçue !</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
            
            <p style="color: #6b7280;">Nous avons bien reçu votre demande de devis.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">📋 Détails de votre demande</h3>
              <p style="margin: 5px 0;"><strong>Type de travaux:</strong> ${type_travaux}</p>
              <p style="margin: 5px 0;"><strong>Localisation:</strong> ${adresse}, ${code_postal} ${ville}</p>
              <p style="margin: 5px 0;"><strong>Numéro de demande:</strong> #${result.insertId}</p>
            </div>
            
            <p style="color: #6b7280;">Notre équipe va examiner votre demande et la publier, des prestataires pourront vous contacter en envoyant des devis pour votre demande.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Visiter Indebel
              </a>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>© 2025 Indebel - Plateforme de mise en relation professionnels</p>
          </div>
        </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi email confirmation devis:', emailError);
    }

    // Envoyer notification à l'admin
    try {
      await sendEmail({
        to: getAdminEmails(),
        subject: `🆕 Nouvelle demande de devis #${result.insertId}`,
        text: `Une nouvelle demande de devis a été soumise.\n\nClient: ${prenom} ${nom}\nEmail: ${email}\nType: ${type_travaux}\nVille: ${ville}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🆕 Nouvelle demande de devis</h2>
          <p><strong>Numéro:</strong> #${result.insertId}</p>
          <p><strong>Client:</strong> ${prenom} ${nom}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Type:</strong> ${type_travaux}</p>
          <p><strong>Ville:</strong> ${ville}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/devis" 
             style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Voir la demande
          </a>
        </div>
        `
      });
    } catch (notifyError) {
      console.error('Erreur notification admin:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Demande de devis créée avec succès',
      data: {
        id: result.insertId
      }
    });

  } catch (error) {
    console.error('Erreur création demande devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la demande de devis'
    });
  }
};

// Récupérer toutes les demandes (admin)
exports.getAllDemandes = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (statut && statut !== 'all') {
      whereClause = 'WHERE d.statut = ?';
      params.push(statut);
    }

    // 1. Récupérer les IDs des demandes paginées pour éviter le tri sur toute la table
    const [idResults] = await db.query(
      `SELECT d.id FROM demandes_devis d
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    if (idResults.length === 0) {
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
          SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valide,
          SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as refuse,
          SUM(CASE WHEN statut = 'traite' THEN 1 ELSE 0 END) as traite,
          SUM(CASE WHEN statut = 'devis_complet' THEN 1 ELSE 0 END) as devis_complet
        FROM demandes_devis
      `);
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM demandes_devis d ${whereClause}`, params);

      return res.json({
        success: true,
        data: {
          demandes: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total, pages: Math.ceil(countResult[0].total / limit) },
          stats: stats[0]
        }
      });
    }

    const demandeIds = idResults.map(r => r.id);

    // 2. Récupérer les détails allégés uniquement pour les IDs de la page actuelle (Optimisation performance)
    const [demandes] = await db.query(
      `SELECT d.id,
              d.type_travaux,
              d.categorie,
              -- d.description, (Exclu pour la liste)
              d.urgence,
              -- d.adresse, (Exclu)
              d.code_postal,
              d.ville,
              d.region,
              d.prenom,
              d.nom,
              d.email,
              d.telephone,
              d.date_souhaite,
              d.heure_souhaite,
              d.budget_estime,
              -- d.details_complementaires, (Exclu, lourd)
              -- d.fichiers_joints, (Exclu, très lourd)
              d.statut,
              d.commentaire_admin,
              d.traite_par,
              d.date_validation,
              d.created_at,
              d.updated_at,
              u.prenom as admin_prenom, 
              u.nom as admin_nom,
              COALESCE((
                SELECT COUNT(*) 
                FROM devis_soumis ds 
                WHERE ds.demande_devis_id = d.id
              ), 0) as nb_devis_soumis
       FROM demandes_devis d
       LEFT JOIN users u ON d.traite_par = u.id
       WHERE d.id IN (?)
       ORDER BY d.created_at DESC`,
      [demandeIds]
    );

    // Compter le total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM demandes_devis d ${whereClause}`,
      params
    );

    // Statistiques
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valide,
        SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as refuse,
        SUM(CASE WHEN statut = 'traite' THEN 1 ELSE 0 END) as traite,
        SUM(CASE WHEN statut = 'devis_complet' THEN 1 ELSE 0 END) as devis_complet
      FROM demandes_devis
    `);

    res.json({
      success: true,
      data: {
        demandes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        },
        stats: stats[0]
      }
    });

  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes'
    });
  }
};

// Récupérer une demande par ID (admin)
exports.getDemandeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [demandes] = await db.query(
      `SELECT d.*, 
              u.prenom as admin_prenom, 
              u.nom as admin_nom, 
              u.email as admin_email,
              COALESCE((
                SELECT COUNT(*) 
                FROM devis_soumis ds 
                WHERE ds.demande_devis_id = d.id
              ), 0) as nb_devis_soumis
       FROM demandes_devis d
       LEFT JOIN users u ON d.traite_par = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Récupérer aussi les devis soumis avec infos freelancers
    const [devisSoumis] = await db.query(
      `SELECT ds.*, 
              u.nom as freelancer_nom, 
              u.prenom as freelancer_prenom,
              u.email as freelancer_email,
              u.telephone as freelancer_telephone
       FROM devis_soumis ds
       JOIN users u ON ds.freelancer_id = u.id
       WHERE ds.demande_devis_id = ?
       ORDER BY ds.date_soumission DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...demandes[0],
        devis_soumis: devisSoumis
      }
    });

  } catch (error) {
    console.error('Erreur récupération demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la demande'
    });
  }
};

// Valider une demande (admin)
exports.validerDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const adminId = req.user.id;

    const [demandes] = await db.query(
      'SELECT * FROM demandes_devis WHERE id = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    const demande = demandes[0];

    await db.query(
      `UPDATE demandes_devis 
       SET statut = 'valide', 
           commentaire_admin = ?, 
           traite_par = ?, 
           date_validation = NOW()
       WHERE id = ?`,
      [commentaire || null, adminId, id]
    );

    // Envoyer email au client
    try {
      await sendEmail({
        to: demande.email,
        subject: '✅ Votre demande de devis a été validée - Indebel',
        text: `Bonjour ${demande.prenom} ${demande.nom},\n\nVotre demande de devis #${id} pour ${demande.type_travaux} a été validée.\n\n${commentaire ? 'Message de notre équipe: ' + commentaire + '\n\n' : ''}Nous allons maintenant mettre en relation les professionnels de votre région avec votre demande.\n\nCordialement,\nL'équipe Indebel`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Demande validée</h1>
          </div>
          <div style="padding: 30px;">
            <p>Bonjour <strong>${demande.prenom} ${demande.nom}</strong>,</p>
            <p>Votre demande de devis <strong>#${id}</strong> pour <strong>${demande.type_travaux}</strong> a été validée.</p>
            ${commentaire ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Message:</strong> ${commentaire}</p>
            </div>` : ''}
            <p>Nous allons maintenant mettre en relation les professionnels de votre région avec votre demande.</p>
          </div>
        </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi email validation:', emailError);
    }

    // Notifier automatiquement les freelancers qualifiés
    try {
      const { matchedFreelancers, demandeData } = await matchFreelancersForDemande(id);

      if (matchedFreelancers.length > 0) {
        // Insérer les notifications
        const notifications = matchedFreelancers.map(f => [id, f.id]);
        await db.query(
          'INSERT IGNORE INTO devis_notifications (demande_devis_id, freelancer_id) VALUES ?',
          [notifications]
        );

        // Envoyer les emails de notification
        for (const freelancer of matchedFreelancers) {
          try {
            await sendEmail({
              to: freelancer.email,
              subject: '🎯 Nouvelle opportunité de mission correspondant à votre profil',
              html: `
                <h2>Bonjour ${freelancer.prenom} ${freelancer.nom},</h2>
                <p>Une nouvelle demande de devis correspond à vos compétences !</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">${demandeData.type_travaux}</h3>
                  <p><strong>Catégorie:</strong> ${demandeData.categorie || 'Non spécifiée'}</p>
                  <p><strong>Localisation:</strong> ${demandeData.ville}, ${demandeData.region}</p>
                  <p><strong>Budget estimé:</strong> ${demandeData.budget_estime ? demandeData.budget_estime + ' €' : 'Non communiqué'}</p>
                  <p><strong>Date souhaitée:</strong> ${demandeData.date_souhaite || 'Non spécifiée'}</p>
                </div>

                <p><strong>Description:</strong></p>
                <p>${demandeData.description}</p>

                <p style="margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/freelancer/devis-disponibles" 
                     style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir et soumettre un devis
                  </a>
                </p>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  Cette opportunité est limitée aux 5 premiers freelancers qui soumettront un devis.
                </p>
              `
            });
          } catch (emailError) {
            console.error(`Erreur envoi email à ${freelancer.email}:`, emailError);
          }
        }

        console.log(`✅ ${matchedFreelancers.length} freelancers notifiés pour la demande #${id}`);
      }
    } catch (notifError) {
      console.error('Erreur notification freelancers:', notifError);
      // Ne pas bloquer la validation si la notification échoue
    }

    res.json({
      success: true,
      message: 'Demande validée avec succès et freelancers notifiés'
    });

  } catch (error) {
    console.error('Erreur validation demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation'
    });
  }
};

// Refuser une demande (admin)
exports.refuserDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const adminId = req.user.id;

    const [demandes] = await db.query(
      'SELECT * FROM demandes_devis WHERE id = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    const demande = demandes[0];

    await db.query(
      `UPDATE demandes_devis 
       SET statut = 'refuse', 
           commentaire_admin = ?, 
           traite_par = ?, 
           date_validation = NOW()
       WHERE id = ?`,
      [commentaire || null, adminId, id]
    );

    // Envoyer email au client
    try {
      await sendEmail({
        to: demande.email,
        subject: '❌ Votre demande de devis - Indebel',
        text: `Bonjour ${demande.prenom} ${demande.nom},\n\nNous avons examiné votre demande de devis #${id}.\n\n${commentaire || 'Malheureusement, nous ne pouvons pas donner suite à votre demande pour le moment.'}\n\nCordialement,\nL'équipe Indebel`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ef4444; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Votre demande de devis</h1>
          </div>
          <div style="padding: 30px;">
            <p>Bonjour <strong>${demande.prenom} ${demande.nom}</strong>,</p>
            <p>Nous avons examiné votre demande de devis <strong>#${id}</strong>.</p>
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">${commentaire || 'Malheureusement, nous ne pouvons pas donner suite à votre demande pour le moment.'}</p>
            </div>
          </div>
        </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi email refus:', emailError);
    }

    res.json({
      success: true,
      message: 'Demande refusée'
    });

  } catch (error) {
    console.error('Erreur refus demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus'
    });
  }
};

// Marquer comme traitée (admin)
exports.marquerTraitee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    await db.query(
      `UPDATE demandes_devis 
       SET statut = 'traite', traite_par = ?
       WHERE id = ?`,
      [adminId, id]
    );

    res.json({
      success: true,
      message: 'Demande marquée comme traitée'
    });

  } catch (error) {
    console.error('Erreur màj statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Récupérer les catégories de travaux (depuis missions)
exports.getCategories = async (req, res) => {
  try {
    // Récupérer les catégories distinctes depuis les deux tables de missions
    // Récupérer les secteurs d'activité (anciennement "catégories")
    const [categories] = await db.query(`
      SELECT id, nom 
      FROM secteurs_activite 
      WHERE actif = 1
      ORDER BY ordre ASC, nom ASC
    `);

    // Pas besoin de re-mapper si on sélectionne déjà id et nom
    const formattedCategories = categories;

    res.json({
      success: true,
      data: formattedCategories
    });

  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};

// Supprimer une demande (admin)
exports.deleteDemande = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM demandes_devis WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Demande supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

// Récupérer les devis validés pour la page publique (< 5 devis soumis)
exports.getDevisValides = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 1. Récupérer d'abord les IDs pour la pagination (optimisation mémoire)
    const [idResults] = await db.query(
      `SELECT dd.id,
              COALESCE((
                SELECT COUNT(*) 
                FROM devis_soumis ds 
                WHERE ds.demande_devis_id = dd.id
              ), 0) as nb_devis_soumis
       FROM demandes_devis dd
       WHERE dd.statut = 'valide'
       HAVING nb_devis_soumis < 5
       ORDER BY dd.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    // Compter le total (pour la pagination)
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM demandes_devis dd
       WHERE dd.statut = 'valide'
       AND (
         SELECT COUNT(*) 
         FROM devis_soumis ds 
         WHERE ds.demande_devis_id = dd.id
       ) < 5`,
      []
    );

    if (idResults.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    }

    const devisIds = idResults.map(d => d.id);

    // 2. Récupérer les détails complets pour les IDs trouvés
    const [demandes] = await db.query(
      `SELECT dd.id, 
              dd.type_travaux, 
              dd.categorie, 
              dd.description, 
              dd.urgence, 
              dd.ville, 
              dd.region,
              dd.code_postal,
              dd.adresse,
              dd.date_souhaite, 
              dd.heure_souhaite,
              dd.budget_estime, 
              dd.details_complementaires, 
              dd.fichiers_joints,
              dd.created_at,
              COALESCE((
                SELECT COUNT(*) 
                FROM devis_soumis ds 
                WHERE ds.demande_devis_id = dd.id
              ), 0) as nb_devis_soumis
       FROM demandes_devis dd
       WHERE dd.id IN (?)
       ORDER BY dd.created_at DESC`,
      [devisIds]
    );

    res.json({
      success: true,
      data: demandes,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération devis validés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis'
    });
  }
};

// Récupérer les statistiques des devis (admin)
exports.getDevisStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valide,
        SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as refuse,
        SUM(CASE WHEN statut = 'traite' THEN 1 ELSE 0 END) as traite,
        SUM(CASE WHEN statut = 'devis_complet' THEN 1 ELSE 0 END) as devis_complet
      FROM demandes_devis
    `);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Erreur récupération statistiques devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};
