const db = require('../config/database');
const { sendEmail } = require('../config/email');

// Algorithme de matching: Trouver les freelancers qualifiés pour une demande
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
    // On cherche dans le profil freelancer (table users avec role='freelancer')
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

    return matchedFreelancers;

  } catch (error) {
    console.error('Erreur matching freelancers:', error);
    throw error;
  }
};

// Notifier les freelancers qualifiés après validation admin
exports.notifierFreelancersQualifies = async (req, res) => {
  try {
    const { demandeId } = req.params;

    // Vérifier que la demande est validée
    const [demande] = await db.query(
      'SELECT * FROM demandes_devis WHERE id = ? AND statut = "valide"',
      [demandeId]
    );

    if (!demande || demande.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande introuvable ou non validée'
      });
    }

    // Matcher les freelancers
    const matchedFreelancers = await matchFreelancersForDemande(demandeId);

    if (matchedFreelancers.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun freelancer qualifié trouvé',
        matched: 0
      });
    }

    // Insérer les notifications
    const notifications = matchedFreelancers.map(f => [demandeId, f.id]);

    await db.query(
      'INSERT IGNORE INTO devis_notifications (demande_devis_id, freelancer_id) VALUES ?',
      [notifications]
    );

    // Envoyer les emails de notification
    const demandeData = demande[0];
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

    res.json({
      success: true,
      message: `${matchedFreelancers.length} freelancers notifiés`,
      matched: matchedFreelancers.length
    });

  } catch (error) {
    console.error('Erreur notification freelancers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la notification'
    });
  }
};

// Récupérer les demandes disponibles pour un freelancer (statut valide, < 5 devis)
exports.getDemandesDisponibles = async (req, res) => {
  try {
    const freelancerId = req.user.id;

    // Étape 1: Récupérer seulement les IDs pour le tri et le filtrage (léger)
    const [ids] = await db.query(`
      SELECT 
        dd.id,
        COALESCE((
          SELECT COUNT(*) 
          FROM devis_soumis ds 
          WHERE ds.demande_devis_id = dd.id
        ), 0) as nb_devis_soumis
      FROM demandes_devis dd
      WHERE dd.statut = 'valide'
      HAVING nb_devis_soumis < 5
      ORDER BY dd.created_at DESC
    `);

    if (ids.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const idList = ids.map(row => row.id);

    // Étape 2: Récupérer les détails allégés pour les IDs filtrés
    const [demandes] = await db.query(`
      SELECT 
        dd.id,
        dd.type_travaux,
        dd.categorie,
        -- dd.description, (Exclu liste)
        dd.urgence,
        -- dd.adresse,
        dd.code_postal,
        dd.ville,
        dd.region,
        -- dd.prenom, (Anonyme pour freelancer avant validation)
        -- dd.nom,
        -- dd.email,
        -- dd.telephone,
        dd.date_souhaite,
        dd.heure_souhaite,
        dd.budget_estime,
        -- dd.details_complementaires,
        -- dd.fichiers_joints,
        dd.statut,
        dd.created_at,
        dd.updated_at,
        COALESCE((
          SELECT COUNT(*) 
          FROM devis_soumis ds 
          WHERE ds.demande_devis_id = dd.id
        ), 0) as nb_devis_soumis,
        EXISTS(
          SELECT 1 
          FROM devis_soumis ds_mine 
          WHERE ds_mine.demande_devis_id = dd.id 
          AND ds_mine.freelancer_id = ?
        ) as deja_soumis
      FROM demandes_devis dd
      WHERE dd.id IN (?)
      ORDER BY dd.created_at DESC
    `, [freelancerId, idList]);

    res.json({
      success: true,
      data: demandes
    });

  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes'
    });
  }
};

// Récupérer les détails d'une demande pour un freelancer
exports.getDemandeByIdForFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.id;

    const [demandes] = await db.query(`
      SELECT 
        dd.id,
        dd.type_travaux,
        dd.categorie,
        dd.description,
        dd.urgence,
        dd.adresse,
        dd.code_postal,
        dd.ville,
        dd.region,
        -- dd.prenom, (Anonyme)
        -- dd.nom,
        -- dd.email,
        -- dd.telephone,
        dd.date_souhaite,
        dd.heure_souhaite,
        dd.budget_estime,
        dd.details_complementaires,
        dd.fichiers_joints,
        dd.statut,
        dd.created_at,
        dd.updated_at,
        EXISTS(
          SELECT 1 
          FROM devis_soumis ds_mine 
          WHERE ds_mine.demande_devis_id = dd.id 
          AND ds_mine.freelancer_id = ?
        ) as deja_soumis
      FROM demandes_devis dd
      WHERE dd.id = ? 
      AND dd.statut = 'valide'
    `, [freelancerId, id]);

    if (demandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée ou non disponible'
      });
    }

    res.json({
      success: true,
      data: demandes[0]
    });

  } catch (error) {
    console.error('Erreur récupération détail demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la demande'
    });
  }
};

// Soumettre un devis (freelancer)
exports.soumettreDevis = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const { demande_devis_id, montant, delai_realisation, description, fichiers } = req.body;

    // Validation (montant et delai_realisation optionnels)
    if (!demande_devis_id || !description) {
      return res.status(400).json({
        success: false,
        message: 'Les champs demande_devis_id et description sont obligatoires'
      });
    }

    // Vérifier que la demande existe et est validée
    const [demande] = await db.query(
      'SELECT * FROM demandes_devis WHERE id = ? AND statut = "valide"',
      [demande_devis_id]
    );

    if (!demande || demande.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande introuvable ou non validée'
      });
    }

    const demandeData = demande[0];

    // Vérifier qu'il n'y a pas déjà 5 devis
    const [countResult] = await db.query(
      'SELECT COUNT(*) as nb FROM devis_soumis WHERE demande_devis_id = ?',
      [demande_devis_id]
    );

    if (countResult[0].nb >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà reçu 5 devis (maximum atteint)'
      });
    }

    // Vérifier que le freelancer n'a pas déjà soumis un devis
    const [existing] = await db.query(
      'SELECT id FROM devis_soumis WHERE demande_devis_id = ? AND freelancer_id = ?',
      [demande_devis_id, freelancerId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà soumis un devis pour cette demande'
      });
    }

    // Vérifier les limites du forfait du freelancer
    const [userPlan] = await db.query(
      `SELECT f.max_devis, f.nom as forfait_nom 
       FROM users u 
       JOIN forfaits f ON u.forfait_id = f.id 
       WHERE u.id = ?`,
      [freelancerId]
    );

    if (userPlan.length > 0 && userPlan[0].max_devis !== null) {
      const limit = userPlan[0].max_devis;

      // Compter les devis soumis ce mois-ci
      const [countMonth] = await db.query(
        `SELECT COUNT(*) as nb 
         FROM devis_soumis 
         WHERE freelancer_id = ? 
         AND MONTH(date_soumission) = MONTH(CURRENT_DATE()) 
         AND YEAR(date_soumission) = YEAR(CURRENT_DATE())`,
        [freelancerId]
      );

      if (countMonth[0].nb >= limit) {
        return res.status(403).json({
          success: false,
          message: `La limite de ${limit} devis par mois pour votre forfait ${userPlan[0].forfait_nom} est atteinte. Passez au forfait supérieur pour plus de devis.`,
          code: 'LIMIT_REACHED'
        });
      }
    }

    // Insérer le devis
    const [result] = await db.query(
      `INSERT INTO devis_soumis 
       (demande_devis_id, freelancer_id, montant, delai_realisation, description, fichiers)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        demande_devis_id,
        freelancerId,
        (montant === undefined || montant === '' ? null : montant),
        (delai_realisation === undefined || delai_realisation === '' ? null : delai_realisation),
        description,
        fichiers ? JSON.stringify(fichiers) : null
      ]
    );

    // Récupérer le nombre total de devis
    const [newCount] = await db.query(
      'SELECT COUNT(*) as nb FROM devis_soumis WHERE demande_devis_id = ?',
      [demande_devis_id]
    );

    // Si on atteint 5 devis, changer le statut de la demande
    if (newCount[0].nb >= 5) {
      await db.query(
        'UPDATE demandes_devis SET statut = "devis_complet" WHERE id = ?',
        [demande_devis_id]
      );
    }

    // Récupérer les infos du freelancer
    const [freelancer] = await db.query(
      'SELECT nom, prenom, email, telephone FROM users WHERE id = ?',
      [freelancerId]
    );

    const freelancerData = freelancer[0];

    // Email confirmation au freelancer avec infos du client
    try {
      await sendEmail({
        to: freelancerData.email,
        subject: '✅ Votre devis a été envoyé avec succès',
        html: `
          <h2>Bonjour ${freelancerData.prenom},</h2>
          <p>Votre devis a été envoyé avec succès !</p>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 ${demandeData.type_travaux}</h3>
            <p><strong>Votre montant proposé:</strong> ${(montant === undefined || montant === '' || montant === null) ? 'Non communiqué' : (montant + ' €')}</p>
            <p><strong>Votre délai:</strong> ${(delai_realisation === undefined || String(delai_realisation).trim() === '' || delai_realisation === null) ? 'Non communiqué' : delai_realisation}</p>
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📍 Informations du client</h3>
            <p><strong>Nom:</strong> ${demandeData.prenom} ${demandeData.nom}</p>
            <p><strong>Adresse complète:</strong> ${demandeData.adresse}, ${demandeData.code_postal} ${demandeData.ville}, ${demandeData.region}</p>
            <p><strong>Téléphone:</strong> ${demandeData.telephone}</p>
            <p><strong>Email:</strong> ${demandeData.email}</p>
          </div>

          <p style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <strong>ℹ️ Note:</strong> Le client sera notifié de votre devis. S'il vous choisit, il pourra vous contacter directement avec les informations ci-dessus.
          </p>
        `
      });
    } catch (e) { console.error('Email freelancer:', e); }

    // Envoyer un email au client avec infos du freelancer
    try {
      await sendEmail({
        to: demandeData.email,
        subject: '📩 Nouveau devis reçu pour votre demande',
        html: `
          <h2>Bonjour ${demandeData.prenom} ${demandeData.nom},</h2>
          <p>Vous avez reçu un nouveau devis pour votre demande de travaux !</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Votre demande: ${demandeData.type_travaux}</h3>
            <p><strong>Lieu:</strong> ${demandeData.ville}, ${demandeData.region}</p>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">💼 Devis soumis par: ${freelancerData.prenom} ${freelancerData.nom}</h3>
            <p><strong>Montant proposé:</strong> ${(montant === undefined || montant === '' || montant === null) ? 'Non communiqué' : (montant + ' €')}</p>
            <p><strong>Délai de réalisation:</strong> ${(delai_realisation === undefined || String(delai_realisation).trim() === '' || delai_realisation === null) ? 'Non communiqué' : delai_realisation}</p>
            <p><strong>Description:</strong></p>
            <p style="white-space: pre-wrap;">${description}</p>
          </div>

          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e40af;">📞 Si vous choisissez ce prestataire, voici ses coordonnées :</h4>
            <p><strong>Nom:</strong> ${freelancerData.prenom} ${freelancerData.nom}</p>
            <p><strong>Téléphone:</strong> ${freelancerData.telephone}</p>
            <p><strong>Email:</strong> ${freelancerData.email}</p>
            <p style="margin-top: 15px; font-size: 14px; color: #374151;">
              Vous pouvez contacter directement ce prestataire pour discuter des détails de votre projet.
            </p>
          </div>

          <p><strong>Nombre de devis reçus:</strong> ${newCount[0].nb} / 5</p>

          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/mes-devis/${demande_devis_id}" 
               style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir tous mes devis
            </a>
          </p>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Vous pouvez comparer les devis reçus et choisir celui qui vous convient le mieux.
          </p>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi email au client:', emailError);
    }

    // Envoyer notification à l'admin
    try {
      await sendEmail({
        to: 'noreply@indebel.be',
        subject: `💼 Nouveau devis soumis pour la demande #${demande_devis_id}`,
        html: `
          <h2>Nouveau devis soumis</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Demande: ${demandeData.type_travaux}</h3>
            <p><strong>Demande ID:</strong> #${demande_devis_id}</p>
            <p><strong>Client:</strong> ${demandeData.prenom} ${demandeData.nom}</p>
            <p><strong>Lieu:</strong> ${demandeData.ville}, ${demandeData.region}</p>
          </div>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>💼 Freelancer: ${freelancerData.prenom} ${freelancerData.nom}</h3>
            <p><strong>Email:</strong> ${freelancerData.email}</p>
            <p><strong>Téléphone:</strong> ${freelancerData.telephone}</p>
            <p><strong>Montant:</strong> ${(montant === undefined || montant === '' || montant === null) ? 'Non communiqué' : (montant + ' €')}</p>
            <p><strong>Délai:</strong> ${(delai_realisation === undefined || String(delai_realisation).trim() === '' || delai_realisation === null) ? 'Non communiqué' : delai_realisation}</p>
          </div>
          <p><strong>Nombre de devis reçus:</strong> ${newCount[0].nb} / 5</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/admin/devis" 
               style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir dans l'admin
            </a>
          </p>
        `
      });
    } catch (adminEmailError) {
      console.error('Erreur envoi email admin:', adminEmailError);
    }

    res.json({
      success: true,
      message: 'Devis soumis avec succès',
      data: {
        id: result.insertId,
        nb_devis_total: newCount[0].nb,
        statut_demande: newCount[0].nb >= 5 ? 'devis_complet' : 'valide'
      }
    });

  } catch (error) {
    console.error('Erreur soumission devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission du devis'
    });
  }
};

// Récupérer les devis soumis pour une demande (admin ou client)
exports.getDevisPourDemande = async (req, res) => {
  try {
    const { demandeId } = req.params;

    const [devis] = await db.query(`
      SELECT 
        ds.*,
        u.nom as freelancer_nom,
        u.prenom as freelancer_prenom,
        u.email as freelancer_email,
        u.telephone as freelancer_telephone
      FROM devis_soumis ds
      JOIN users u ON ds.freelancer_id = u.id
      WHERE ds.demande_devis_id = ?
      ORDER BY ds.date_soumission DESC
    `, [demandeId]);

    res.json({
      success: true,
      data: devis
    });

  } catch (error) {
    console.error('Erreur récupération devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis'
    });
  }
};

// Récupérer mes devis soumis (freelancer)
exports.getMesDevisSoumis = async (req, res) => {
  try {
    const freelancerId = req.user.id;

    const [devis] = await db.query(`
      SELECT 
        ds.*,
        dd.type_travaux,
        dd.categorie,
        dd.description as demande_description,
        dd.ville,
        dd.region,
        dd.statut as demande_statut
      FROM devis_soumis ds
      JOIN demandes_devis dd ON ds.demande_devis_id = dd.id
      WHERE ds.freelancer_id = ?
      ORDER BY ds.date_soumission DESC
    `, [freelancerId]);

    res.json({
      success: true,
      data: devis
    });

  } catch (error) {
    console.error('Erreur récupération mes devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos devis'
    });
  }
};

module.exports = exports;
