const db = require('../config/database');
const crypto = require('crypto');
const { sendEmail } = require('../config/email');
const { checkDevisViewAccess, sendLimitReached, getEffectiveForfait, getMonthlyAiCounter } = require('../services/devisViewLimitService');

const normalizeDevisFiles = (demande) => {
  if (!demande) return demande;

  const isEmpty = value => !value || value === '[]';
  const source = !isEmpty(demande.fichiers_joints) ? demande.fichiers_joints : demande.images;
  if (isEmpty(source)) return demande;

  const guessMime = name => {
    const ext = String(name || '').toLowerCase().split('.').pop();
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'svg') return 'image/svg+xml';
    if (ext === 'pdf') return 'application/pdf';
    return 'image/jpeg';
  };

  const normalizeFile = (file, index) => {
    if (!file) return null;

    if (typeof file === 'string') {
      return { name: `Fichier ${index + 1}`, data: file };
    }

    const data = file.data || file.url || file.src || file.preview || file.path || file.file;
    const normalized = { ...file, data };

    if (normalized.data && !String(normalized.data).startsWith('data:') && /^[A-Za-z0-9+/=]+$/.test(String(normalized.data).slice(0, 120))) {
      normalized.data = `data:${guessMime(normalized.name)};base64,${normalized.data}`;
    }

    return normalized;
  };

  try {
    const parsed = Array.isArray(source) ? source : JSON.parse(source);
    if (Array.isArray(parsed)) {
      demande.fichiers_joints = JSON.stringify(parsed.map(normalizeFile).filter(Boolean));
    }
  } catch (error) {
    demande.fichiers_joints = JSON.stringify([normalizeFile(source, 0)].filter(Boolean));
  }

  return demande;
};

const recordDevisPageView = async (req, demandeId, source = 'freelancer_detail') => {
  const userId = req.user && req.user.id;
  if (!userId || !demandeId) return;

  const ip = String(req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').split(',')[0].trim().slice(0, 80);
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 255);

  try {
    await db.query(
      `INSERT INTO devis_page_views (demande_devis_id, user_id, ip_address, user_agent, source)
       VALUES (?, ?, ?, ?, ?)`,
      [demandeId, userId, ip || null, userAgent || null, source]
    );
  } catch (error) {
    console.error('Erreur enregistrement vue devis prestataire:', error.message);
  }
};

const recordMultipleDevisPageViews = async (req, demandes, source = 'freelancer_dashboard') => {
  const userId = req.user && req.user.id;
  if (!userId || !Array.isArray(demandes) || demandes.length === 0) return;

  const ip = String(req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').split(',')[0].trim().slice(0, 80);
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 255);
  const rows = demandes
    .map(demande => demande && demande.id)
    .filter(Boolean)
    .map(id => [id, userId, ip || null, userAgent || null, source]);

  if (!rows.length) return;

  try {
    await db.query(
      `INSERT INTO devis_page_views (demande_devis_id, user_id, ip_address, user_agent, source)
       VALUES ?`,
      [rows]
    );
  } catch (error) {
    console.error('Erreur enregistrement vues devis dashboard:', error.message);
  }
};

const ensureVerifiedFreelancer = async (freelancerId) => {
  return { allowed: true };
};

// Algorithme de matching: Trouver les prestataires qualifies par secteur
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
    const normalize = value => String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const parseList = value => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return String(value).split(',').map(item => item.trim()).filter(Boolean);
      }
    };
    const demandeSecteurs = [demandeData.categorie || demandeData.type_travaux]
      .filter(Boolean)
      .map(normalize);

    const [freelancers] = await db.query(`
      SELECT DISTINCT u.id, u.nom, u.prenom, u.email, u.telephone,
             u.competences, u.secteur as secteurs_activite
      FROM users u
      WHERE u.role = 'freelancer'
        AND u.secteur IS NOT NULL
    `);

    return freelancers
      .map(freelancer => {
        const secteurs = parseList(freelancer.secteurs_activite).map(normalize);
        const hasSectorMatch = demandeSecteurs.some(secteur => secteurs.some(s => s === secteur));
        return { ...freelancer, score: hasSectorMatch ? 100 : 0 };
      })
      .filter(f => f.score > 0);

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
      'SELECT * FROM demandes_devis WHERE id = ? AND statut IN ("valide", "traite", "devis_complet")',
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
              Cette opportunité vous est envoyée car votre secteur correspond à la demande validée.
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    // Étape 1: Récupérer seulement les IDs pour le tri et le filtrage (léger)
    const [ids] = await db.query(`
      SELECT 
        dd.id
      FROM demandes_devis dd
      WHERE dd.statut IN ('valide', 'traite', 'devis_complet')
      AND NOT EXISTS (
        SELECT 1 FROM devis_soumis ds WHERE ds.demande_devis_id = dd.id AND ds.freelancer_id = ?
      )
      AND (
        dd.statut IN ('valide', 'traite')
        OR EXISTS (
          SELECT 1
          FROM devis_notifications dn
          WHERE dn.demande_devis_id = dd.id
          AND dn.freelancer_id = ?
        )
      )
      ORDER BY dd.created_at DESC
    `, [freelancerId, freelancerId]);

    const total = ids.length;

    if (total === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: page,
          limit: limit
        }
      });
    }

    const pagedIds = ids.slice(offset, offset + limit).map(row => row.id);

    if (pagedIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit: limit
        }
      });
    }

    // Étape 2: Récupérer les détails allégés pour les IDs filtrés et paginés
    const [demandes] = await db.query(`
      SELECT 
        dd.id,
        dd.type_travaux,
        dd.categorie,
        dd.urgence,
        NULL as adresse,
        dd.code_postal,
        dd.ville,
        dd.region,
        NULL as prenom,
        NULL as nom,
        NULL as email,
        NULL as telephone,
        dd.date_souhaite,
        dd.heure_souhaite,
        dd.budget_estime,
        dd.description,
        dd.details_complementaires,
        NULL as fichiers_joints,
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
    `, [freelancerId, pagedIds]);

    await recordMultipleDevisPageViews(req, demandes, 'freelancer_dashboard');

    res.json({
      success: true,
      data: demandes,
      pagination: {
        total: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit: limit
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

// Récupérer les détails d'une demande pour un freelancer
exports.getDemandeByIdForFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.id;
    const verification = await ensureVerifiedFreelancer(freelancerId);

    if (!verification.allowed) {
      return res.status(403).json({
        success: false,
        code: verification.code,
        message: verification.message
      });
    }

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
        dd.prenom,
        dd.nom,
        dd.email,
        dd.telephone,
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
      AND dd.statut IN ('valide', 'traite', 'devis_complet')
      AND (
        dd.statut IN ('valide', 'traite')
        OR EXISTS (
          SELECT 1
          FROM devis_notifications dn
          WHERE dn.demande_devis_id = dd.id
          AND dn.freelancer_id = ?
        )
      )
    `, [freelancerId, id, freelancerId]);

    if (demandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée ou non disponible'
      });
    }

    const access = await checkDevisViewAccess(req, id);
    if (!access.allowed) {
      return sendLimitReached(res, access);
    }

    await recordDevisPageView(req, id, 'freelancer_detail');

    res.json({
      success: true,
      data: normalizeDevisFiles(demandes[0]),
      quota: access.limited ? {
        limit: access.limit,
        viewed_count: access.alreadyViewedCurrent ? access.viewedCount : access.viewedCount + 1,
        forfait: access.forfait
      } : null
    });

  } catch (error) {
    console.error('Erreur récupération détail demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la demande'
    });
  }
};

// Rédiger un devis avec l'IA (http://ai.lestagiaire.be/)
exports.generateAIDevis = async (req, res) => {
  try {
    const { demande_devis_id, taux_tva = 21, instructions_supplementaires = '' } = req.body;
    const freelancerId = req.user.id;

    if (!demande_devis_id) {
      return res.status(400).json({ success: false, message: 'demande_devis_id est obligatoire' });
    }

    const [demandes] = await db.query(
      'SELECT * FROM demandes_devis WHERE id = ?',
      [demande_devis_id]
    );

    if (!demandes || demandes.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande de devis introuvable' });
    }

    const demande = demandes[0];

    if (demande.statut === 'traite') {
      return res.status(409).json({
        success: false,
        code: 'DEVIS_CLOSED',
        message: 'Ce devis ne reçoit plus de demandes.'
      });
    }

    if (demande.statut !== 'valide') {
      return res.status(409).json({
        success: false,
        code: 'DEVIS_NOT_AVAILABLE',
        message: 'Cette demande de devis n’est plus disponible.'
      });
    }

    const forfait = await getEffectiveForfait(freelancerId);
    if (forfait) {
      const compteur_devis_ia = await getMonthlyAiCounter(freelancerId);
      const limit = forfait.limite_devis_ia;
      
      if (limit !== null && compteur_devis_ia >= limit) {
        return res.status(403).json({
          success: false,
          code: 'DEVIS_IA_LIMIT_REACHED',
          message: `Limite de devis par IA atteinte (${compteur_devis_ia}/${limit}). Veuillez changer de forfait pour en générer plus.`
        });
      }
    }

    const [freelancers] = await db.query(
      'SELECT nom, prenom, email, telephone, denomination FROM users WHERE id = ?',
      [freelancerId]
    );
    const freelancer = freelancers[0] || {};
    const providerName = freelancer.denomination || `${freelancer.prenom || ''} ${freelancer.nom || ''}`.trim() || 'Prestataire Indebel';

    const tvaRate = parseFloat(taux_tva) || 21;
    const dateDemandeFormated = demande.created_at ? new Date(demande.created_at).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Non précisée';
    const dateSouhaiteFormated = demande.date_souhaite ? new Date(demande.date_souhaite).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Non précisée';

    const promptText = `Tu es un assistant IA sur la plateforme Indebel Belgique.
Formule une proposition de devis naturelle, claire et détaillée en FRANÇAIS. Ne sois pas trop formel ni trop "pro" générique.
Tu dois ABSOLUMENT récupérer la "Description du besoin client" et formuler le devis spécifiquement sur cette base.
Tu dois AUSSI obligatoirement inclure la dénomination du prestataire ("${providerName}") au début de la description du devis.

Tu dois impérativement prendre en compte les dates suivantes :
- Date de la demande : ${dateDemandeFormated}
- Date butoir souhaitée : ${dateSouhaiteFormated}

INFORMATIONS DU CLIENT :
- Nom & Prénom: ${demande.prenom || ''} ${demande.nom || ''}
- Projet: ${demande.type_travaux || 'Prestation de service'}
- Catégorie: ${demande.categorie || 'Général'}
- Budget estimé client: ${demande.budget_estime ? demande.budget_estime + ' €' : 'Non précisé'}
- Description du besoin client: ${demande.description || 'Non spécifiée'}
- Détails complémentaires: ${demande.details_complementaires || 'Aucun'}
- Localisation: ${demande.ville || ''} (${demande.code_postal || ''}), ${demande.region || ''}

INFORMATIONS DU PRESTATAIRE :
- Dénomination du prestataire: ${providerName}
- Taux de TVA: ${tvaRate}%

${instructions_supplementaires ? `Consignes particulières de la part du prestataire: ${instructions_supplementaires}` : ''}

CONSIGNES DE RÉDACTION :
1. Le texte DOIT commencer par faire apparaître la dénomination du prestataire : "${providerName}".
2. Reprends exactement la description du besoin pour formuler l'offre, sans inventer des "phases" si ce n'est pas pertinent.
3. Fais référence à la réalisation ou la livraison pour la date du ${dateSouhaiteFormated}.
4. Formule une réponse naturelle et ciblée, pas un modèle générique.

EXIGENCE DE SORTIE STRICTE (RÉDIGER EN FRANÇAIS EXCLUSIVEMENT):
Renvoie UNIQUEMENT un objet JSON valide suivant exactement la structure ci-dessous, sans texte ni balises additionnelles:
{
  "montant_ht": 450.00,
  "delai_realisation": "Exécution avant le ${dateSouhaiteFormated}",
  "description": "Texte du devis généré commençant par la dénomination du prestataire et reprenant la demande..."
}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const aiRes = await fetch('https://ai.lestagiaire.be/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from('admin:QmO2u1QfB99Zloha4Q').toString('base64')
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'cv-ai',
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.7
        })
      });
      clearTimeout(timeoutId);

      const aiData = await aiRes.json();
      let resultJson = null;

      if (aiData && aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
        const content = aiData.choices[0].message.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          resultJson = JSON.parse(jsonMatch[0]);
        }
      }

      const ht = resultJson && !isNaN(parseFloat(resultJson.montant_ht))
        ? Math.round(parseFloat(resultJson.montant_ht) * 100) / 100
        : (parseFloat(demande.budget_estime) || 350);

      const tvaAmt = Math.round((ht * tvaRate / 100) * 100) / 100;
      const ttc = Math.round((ht + tvaAmt) * 100) / 100;
      const disclaimerText = "\n\nLe montant indiqué est une estimation. Un devis définitif pourra être établi uniquement après une visite sur place, afin d'évaluer précisément les travaux à réaliser.\n\nJe reste à votre disposition pour convenir d'un rendez-vous.";
      
      let description = resultJson?.description || `Proposition de devis professionnel rédigée pour le projet : ${demande.type_travaux || 'Prestation'}.\n\nSuite à votre demande de devis soumise le ${dateDemandeFormated}, nous vous soumettons l'offre ci-après :\n\n- Phase 1 : Étude technique et installation sur site.\n- Phase 2 : Réalisation complète du projet sur mesure conformément à votre cahier des charges (${demande.description || 'Prestation sur mesure'}).\n- Phase 3 : Contrôle qualité final et livraison pour la date butoir souhaitée du ${dateSouhaiteFormated}.\n\nLe montant s'élève à ${ht.toFixed(2)} € HT (TVA ${tvaRate}% en vigueur en Belgique).`;
      description += disclaimerText;

      // Increment the compteur devis IA for the user
      await db.query(
        'UPDATE users SET compteur_devis_ia = compteur_devis_ia + 1 WHERE id = ?',
        [freelancerId]
      );

      return res.json({
        success: true,
        data: {
          montant_ht: ht,
          taux_tva: tvaRate,
          montant_tva: tvaAmt,
          montant_ttc: ttc,
          delai_realisation: delai,
          description: description
        }
      });

    } catch (aiErr) {
      console.warn('AI API indisponible ou timeout, bascule sur le générateur contextuel:', aiErr.message);
      
      const ht = parseFloat(demande.budget_estime) || 350;
      const tvaAmt = Math.round((ht * tvaRate / 100) * 100) / 100;
      const ttc = Math.round((ht + tvaAmt) * 100) / 100;
      
      const customConsignes = instructions_supplementaires ? `\n\nNotes spécifiques intégrées : ${instructions_supplementaires}` : '';
      let fallbackDesc = `${providerName.toUpperCase()}\n\nProjet : ${demande.type_travaux || 'Prestation de service'}\nLieu d'intervention : ${demande.ville || 'Belgique'} ${demande.code_postal ? '(' + demande.code_postal + ')' : ''}\n\nSuite à votre demande de devis déposée le ${dateDemandeFormated} pour le besoin suivant :\n"${demande.description || 'Non spécifié'}"\n\nNous vous proposons l'offre ci-dessous, avec une exécution planifiée pour respecter votre date souhaitée du ${dateSouhaiteFormated}.\n\nPrestations :\n- Réalisation conforme à votre demande initiale.\n${customConsignes}\n\nGaranties & Livraison :\n- Contrôle qualité final et nettoyage.\n- Exécution complète garantie avant le ${dateSouhaiteFormated}.\n\nMontant Total HT : ${ht.toFixed(2)} €\nTVA (${tvaRate}%) : ${tvaAmt.toFixed(2)} €\nTotal TTC : ${ttc.toFixed(2)} €`;
      fallbackDesc += "\n\nLe montant indiqué est une estimation. Un devis définitif pourra être établi uniquement après une visite sur place, afin d'évaluer précisément les travaux à réaliser.\n\nJe reste à votre disposition pour convenir d'un rendez-vous.";

      // Increment the compteur devis IA for the user
      await db.query(
        'UPDATE users SET compteur_devis_ia = compteur_devis_ia + 1 WHERE id = ?',
        [freelancerId]
      );

      return res.json({
        success: true,
        data: {
          montant_ht: ht,
          taux_tva: tvaRate,
          montant_tva: tvaAmt,
          montant_ttc: ttc,
          delai_realisation: `Exécution avant le ${dateSouhaiteFormated}`,
          description: fallbackDesc
        }
      });
    }

  } catch (error) {
    console.error('Erreur génération devis IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du devis avec l\'IA'
    });
  }
};

// Soumettre un devis (freelancer)
exports.soumettreDevis = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const {
      demande_devis_id,
      montant_ht,
      taux_tva = 21,
      montant_tva,
      montant_ttc,
      montant,
      delai_realisation,
      description,
      is_ai_generated = false
    } = req.body;
    
    let fichiersList = req.body.fichiers;
    try {
        if (typeof fichiersList === "string") fichiersList = JSON.parse(fichiersList);
    } catch(e) {}
    if (!Array.isArray(fichiersList)) fichiersList = [];
    
    if (req.files && req.files.length > 0) {
        const uploadedFiles = req.files.map(f => f.filename);
        fichiersList = [...fichiersList, ...uploadedFiles];
    }
    
    const finalFichiers = fichiersList.length > 0 ? fichiersList : null;


    const verification = await ensureVerifiedFreelancer(freelancerId);

    if (!verification.allowed) {
      return res.status(403).json({
        success: false,
        code: verification.code,
        message: verification.message
      });
    }

    if (!demande_devis_id || !description) {
      return res.status(400).json({
        success: false,
        message: 'Les champs demande_devis_id et description sont obligatoires'
      });
    }

    // Vérifier que la demande existe et est validée
    const [demande] = await db.query(
      'SELECT * FROM demandes_devis WHERE id = ? AND statut IN ("valide", "traite", "devis_complet")',
      [demande_devis_id]
    );

    if (!demande || demande.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande introuvable ou non validée'
      });
    }

    const demandeData = demande[0];

    if (demandeData.statut === 'traite') {
      return res.status(409).json({
        success: false,
        code: 'DEVIS_CLOSED',
        message: 'Ce devis ne reçoit plus de demandes.'
      });
    }

    if (demandeData.statut !== 'valide') {
      return res.status(409).json({
        success: false,
        code: 'DEVIS_NOT_AVAILABLE',
        message: 'Cette demande de devis n’est plus disponible.'
      });
    }

    const [countResult] = await db.query(
      'SELECT COUNT(*) as nb FROM devis_soumis WHERE demande_devis_id = ?',
      [demande_devis_id]
    );

    const [notificationAccess] = await db.query(
      'SELECT id FROM devis_notifications WHERE demande_devis_id = ? AND freelancer_id = ? LIMIT 1',
      [demande_devis_id, freelancerId]
    );

    // Default limit
    let limit = 5;

    // Try to get employer limit based on email
    if (demandeData.email) {
      const [employers] = await db.query(
        'SELECT id FROM users WHERE email = ? AND role = "employer"',
        [demandeData.email]
      );
      if (employers.length > 0) {
        const forfait = await getEffectiveForfait(employers[0].id);
        if (forfait?.max_devis_recus !== null && forfait?.max_devis_recus !== undefined) {
          limit = forfait.max_devis_recus;
        }
      }
    }

    if (countResult[0].nb >= limit && notificationAccess.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Cette demande a déjà reçu le nombre maximum de devis autorisé (${limit})`
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

    // Calcul des montants avec TVA
    const tvaRate = [0, 6, 12, 21].includes(Number(taux_tva)) ? Number(taux_tva) : 21;
    const htVal = parseFloat(montant_ht !== undefined && montant_ht !== '' ? montant_ht : (montant || 0));
    const tvaVal = parseFloat(montant_tva !== undefined && montant_tva !== '' ? montant_tva : (htVal * tvaRate / 100));
    const ttcVal = parseFloat(montant_ttc !== undefined && montant_ttc !== '' ? montant_ttc : (htVal + tvaVal));
    const totalMontant = ttcVal > 0 ? ttcVal : htVal;

    // Token unique pour l'action du client par email
    const tokenAction = crypto.randomBytes(24).toString('hex');

    // Insérer le devis
    const [result] = await db.query(
      `INSERT INTO devis_soumis 
       (demande_devis_id, freelancer_id, montant_ht, taux_tva, montant_tva, montant_ttc, montant, delai_realisation, description, fichiers, token_action, is_ai_generated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        demande_devis_id,
        freelancerId,
        htVal || null,
        tvaRate,
        tvaVal || null,
        ttcVal || null,
        totalMontant || null,
        (delai_realisation === undefined || delai_realisation === '' ? null : delai_realisation),
        description,
        finalFichiers ? JSON.stringify(finalFichiers) : null,
        tokenAction,
        is_ai_generated ? 1 : 0
      ]
    );

    // Récupérer le nombre total de devis
    const [newCount] = await db.query(
      'SELECT COUNT(*) as nb FROM devis_soumis WHERE demande_devis_id = ?',
      [demande_devis_id]
    );

    if (newCount[0].nb >= 5) {
      await db.query(
        'UPDATE demandes_devis SET statut = "devis_complet" WHERE id = ?',
        [demande_devis_id]
      );
    }

    // Infos du freelancer
    const [freelancer] = await db.query(
      'SELECT nom, prenom, email, telephone, denomination FROM users WHERE id = ?',
      [freelancerId]
    );

    const freelancerData = freelancer[0] || {};
    const providerDisplayName = freelancerData.denomination || `${freelancerData.prenom || ''} ${freelancerData.nom || ''}`.trim() || 'Prestataire Indebel';

    // Base URL pour la réponse du client
    const baseUrl = 'https://indebel.be';
    const acceptUrl = `${baseUrl}/reponse-devis?token=${tokenAction}&action=accepter`;
    const refuseUrl = `${baseUrl}/reponse-devis?token=${tokenAction}&action=refuser`;

    // 1. Email confirmation au freelancer
    try {
      await sendEmail({
        to: freelancerData.email,
        subject: `✅ Votre devis (${ttcVal > 0 ? ttcVal.toFixed(2) + ' € TTC' : 'Soumis'}) a été envoyé au client`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background: #2b4eef; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900;">INDEBEL</h1>
              <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Confirmation d'envoi</p>
            </div>
            
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: #2b4eef; margin-top: 0;">Bonjour ${freelancerData.prenom},</h2>
              <p>Félicitations ! Votre devis pour la demande <strong>"${demandeData.type_travaux}"</strong> a été transmis avec succès au client.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #df6422; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #2b4eef; font-size: 16px;">Résumé de votre proposition</h3>
                <p style="margin: 8px 0;"><strong>Montant HT :</strong> ${htVal.toFixed(2)} €</p>
                <p style="margin: 8px 0;"><strong>TVA (${tvaRate}%) :</strong> ${tvaVal.toFixed(2)} €</p>
                <p style="margin: 12px 0 0; font-size: 18px; color: #df6422; font-weight: 900;">Total TTC : ${ttcVal.toFixed(2)} €</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;"><strong>Délai :</strong> ${delai_realisation || 'Non spécifié'}</p>
              </div>

              <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 25px 0;">
                <h4 style="margin: 0 0 12px; color: #2b4eef;">Coordonnées du client (${demandeData.prenom} ${demandeData.nom})</h4>
                <p style="margin: 6px 0;"><strong>📍 Localisation :</strong> ${demandeData.ville} ${demandeData.code_postal ? '(' + demandeData.code_postal + ')' : ''}</p>
                <p style="margin: 6px 0;"><strong>📧 Email :</strong> <a href="mailto:${demandeData.email}" style="color: #df6422; text-decoration: none;">${demandeData.email}</a></p>
                <p style="margin: 6px 0;"><strong>📞 Téléphone :</strong> ${demandeData.telephone ? `<a href="tel:${demandeData.telephone}" style="color: #df6422; text-decoration: none;">${demandeData.telephone}</a>` : 'Non renseigné'}</p>
              </div>

              <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px; line-height: 1.5;">
                Le client a reçu un email contenant votre devis détaillé ainsi qu'un lien direct pour l'accepter ou le refuser. Vous serez notifié(e) dès sa réponse.
              </p>
            </div>
          </div>
        `
      });
    } catch (e) { console.error('Email confirmation freelancer:', e); }

    // 2. Email au client (Particulier) avec boutons Accepter / Refuser
    try {
      await sendEmail({
        to: demandeData.email,
        subject: `📩 Devis reçu pour votre demande : ${demandeData.type_travaux} (${ttcVal.toFixed(2)} € TTC)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background: #2b4eef; padding: 24px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900;">INDEBEL</h1>
              <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Nouveau devis reçu</p>
            </div>

            <div style="padding: 30px; background: #ffffff;">
              <p style="font-size: 16px; margin-top: 0;">Bonjour <strong>${demandeData.prenom} ${demandeData.nom}</strong>,</p>
              <p>Le prestataire <strong>${providerDisplayName}</strong> a étudié votre demande (<em>${demandeData.type_travaux}</em>) et vous propose le devis suivant :</p>

              <div style="background: #f8fafc; border-left: 4px solid #df6422; padding: 20px; margin: 25px 0; border-radius: 12px;">
                <h3 style="margin: 0 0 15px; color: #2b4eef; font-size: 16px;">Détail financier</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Montant HT :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${htVal.toFixed(2)} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">TVA (${tvaRate}%) :</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600;">${tvaVal.toFixed(2)} €</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0 4px; font-weight: 700; color: #2b4eef; font-size: 16px;">Total TTC :</td>
                    <td style="padding: 12px 0 4px; text-align: right; font-weight: 900; color: #df6422; font-size: 20px;">${ttcVal.toFixed(2)} €</td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0; font-size: 13px; color: #475569;"><strong>Délai estimé :</strong> ${delai_realisation || 'À convenir'}</p>
              </div>

              <div style="margin: 25px 0;">
                <h4 style="margin: 0 0 10px; color: #2b4eef;">Description de la prestation :</h4>
                <div style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; font-size: 14px; white-space: pre-wrap; line-height: 1.6; color: #334155;">${description}</div>
              </div>

              <div style="text-align: center; margin: 35px 0 20px; padding: 30px 20px; background: #2b4eef; border-radius: 12px; color: white;">
                <h4 style="margin: 0 0 20px; color: white; font-size: 18px;">Souhaitez-vous accepter ce devis ?</h4>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                  <a href="${acceptUrl}" target="_blank" style="background: #df6422; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 999px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 12px rgba(223,100,34,0.4);">
                    ✅ ACCEPTER
                  </a>
                  <a href="${refuseUrl}" target="_blank" style="background: transparent; border: 2px solid rgba(255,255,255,0.3); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 14px; display: inline-block;">
                    Refuser
                  </a>
                </div>
                <p style="margin: 15px 0 0; font-size: 12px; opacity: 0.8;">En cliquant sur un bouton, votre réponse sera transmise instantanément au prestataire.</p>
              </div>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur envoi email devis client:', emailError);
    }

    // 3. Notification in-app pour l'employeur (si applicable)
    try {
      const [employers] = await db.query('SELECT id FROM users WHERE email = ? AND role = "employer"', [demandeData.email]);
      if (employers.length > 0) {
        await db.query(
          `INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)`,
          [
            employers[0].id,
            'devis_recu',
            'Nouveau devis reçu',
            `Le prestataire ${providerDisplayName} vous a envoyé un devis de ${ttcVal.toFixed(2)} € pour votre demande "${demandeData.type_travaux}".`,
            '/employer/devis-recus'
          ]
        );
      }
    } catch (notifError) {
      console.error('Erreur création notification devis client:', notifError);
    }

    res.json({
      success: true,
      message: 'Devis soumis et transmis au client avec succès',
      data: {
        id: result.insertId,
        token_action: tokenAction,
        montant_ht: htVal,
        taux_tva: tvaRate,
        montant_tva: tvaVal,
        montant_ttc: ttcVal,
        nb_devis_total: newCount[0].nb
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

// Réponse du client (Acceptation / Refus par lien ou jeton)
exports.reponseClient = async (req, res) => {
  try {
    const { token, action, commentaire } = req.body;

    if (!token || !['accepter', 'refuser'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Jeton valide et action (accepter ou refuser) requis'
      });
    }

    const [devisRows] = await db.query(
      `SELECT ds.*, 
              dd.prenom as client_prenom, dd.nom as client_nom, dd.email as client_email, dd.telephone as client_telephone, dd.type_travaux,
              u.prenom as freelancer_prenom, u.nom as freelancer_nom, u.email as freelancer_email, u.telephone as freelancer_telephone, u.denomination as freelancer_company
       FROM devis_soumis ds
       JOIN demandes_devis dd ON ds.demande_devis_id = dd.id
       JOIN users u ON ds.freelancer_id = u.id
       WHERE ds.token_action = ? LIMIT 1`,
      [token]
    );

    if (!devisRows || devisRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Devis introuvable ou lien expiré'
      });
    }

    const devis = devisRows[0];
    const newStatut = action === 'accepter' ? 'accepte' : 'refuse';

    await db.query(
      `UPDATE devis_soumis 
       SET statut = ?, date_reponse = NOW(), commentaire_client = ?
       WHERE id = ?`,
      [newStatut, commentaire || null, devis.id]
    );

    const providerName = devis.freelancer_company || `${devis.freelancer_prenom} ${devis.freelancer_nom}`;
    const ttcDisplay = devis.montant_ttc ? `${parseFloat(devis.montant_ttc).toFixed(2)} € TTC` : (devis.montant ? `${parseFloat(devis.montant).toFixed(2)} €` : 'Montant convenu');

    // 1. Notifier le Prestataire de la décision
    try {
      if (action === 'accepter') {
        await sendEmail({
          to: devis.freelancer_email,
          subject: `🎉 DEVIS ACCEPTÉ par ${devis.client_prenom} ${devis.client_nom} !`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
              <div style="background: #16a34a; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin:0; font-size: 22px;">🎉 Votre Devis a été Accepté !</h1>
              </div>
              <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
                <p>Bonjour <strong>${devis.freelancer_prenom}</strong>,</p>
                <p>Excellente nouvelle ! Le client <strong>${devis.client_prenom} ${devis.client_nom}</strong> vient d'ACCEPTER votre devis de <strong>${ttcDisplay}</strong> pour la demande <em>"${devis.type_travaux}"</em>.</p>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px; color: #166534;">Coordonnées du client pour démarrer :</h3>
                  <p style="margin: 4px 0;"><strong>Nom :</strong> ${devis.client_prenom} ${devis.client_nom}</p>
                  <p style="margin: 4px 0;"><strong>Téléphone :</strong> ${devis.client_telephone || 'Non communiqué'}</p>
                  <p style="margin: 4px 0;"><strong>Email :</strong> ${devis.client_email}</p>
                </div>

                <p>Vous pouvez dès à présent contacter votre client pour planifier l'intervention.</p>
              </div>
            </div>
          `
        });
      } else {
        await sendEmail({
          to: devis.freelancer_email,
          subject: `❌ Information : Votre devis a été refusé par ${devis.client_prenom} ${devis.client_nom}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
              <h2 style="color: #dc2626;">Devis non retenu</h2>
              <p>Bonjour ${devis.freelancer_prenom},</p>
              <p>Le client <strong>${devis.client_prenom} ${devis.client_nom}</strong> n'a pas retenu votre devis pour la demande <em>"${devis.type_travaux}"</em>.</p>
              ${commentaire ? `<p><strong>Commentaire du client :</strong> ${commentaire}</p>` : ''}
              <p style="color: #64748b; font-size: 14px;">Vous pouvez continuer à consulter et postuler à d'autres opportunités sur Indebel.</p>
            </div>
          `
        });
      }
    } catch (e) { console.error('Erreur notification email prestataire réponse client:', e); }

    return res.json({
      success: true,
      message: action === 'accepter' ? 'Le devis a été accepté avec succès !' : 'Le refus a été pris en compte.',
      data: {
        statut: newStatut,
        providerName,
        type_travaux: devis.type_travaux,
        montant_ttc: devis.montant_ttc
      }
    });

  } catch (error) {
    console.error('Erreur réponse client devis:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du traitement de votre réponse' });
  }
};

// Obtenir le détail d'un devis par jeton public (pour l'écran de décision du client)
exports.getDevisByToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Jeton requis' });
    }

    const [rows] = await db.query(
      `SELECT ds.id, ds.montant_ht, ds.taux_tva, ds.montant_tva, ds.montant_ttc, ds.montant, 
              ds.delai_realisation, ds.description, ds.statut, ds.date_reponse, ds.token_action,
              dd.id as demande_id, dd.type_travaux, dd.prenom as client_prenom, dd.nom as client_nom, dd.ville,
              u.prenom as freelancer_prenom, u.nom as freelancer_nom, u.denomination as freelancer_company
       FROM devis_soumis ds
       JOIN demandes_devis dd ON ds.demande_devis_id = dd.id
       JOIN users u ON ds.freelancer_id = u.id
       WHERE ds.token_action = ? LIMIT 1`,
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Devis introuvable' });
    }

    const item = rows[0];

    // Marquer comme lu
    await db.query(
      'UPDATE devis_soumis SET lu_par_client = 1, date_lecture = NOW() WHERE id = ? AND lu_par_client = 0',
      [item.id]
    );

    const providerName = item.freelancer_company || `${item.freelancer_prenom} ${item.freelancer_nom}`;

    res.json({
      success: true,
      data: {
        id: item.id,
        demande_id: item.demande_id,
        type_travaux: item.type_travaux,
        client_name: `${item.client_prenom} ${item.client_nom}`,
        provider_name: providerName,
        montant_ht: item.montant_ht || item.montant,
        taux_tva: item.taux_tva || 21,
        montant_tva: item.montant_tva || 0,
        montant_ttc: item.montant_ttc || item.montant,
        delai_realisation: item.delai_realisation,
        description: item.description,
        statut: item.statut,
        date_reponse: item.date_reponse
      }
    });

  } catch (error) {
    console.error('Erreur récupération devis par jeton:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du devis' });
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

// Récupérer mes devis soumis (freelancer) avec pagination (20 par page)
exports.getMesDevisSoumis = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM devis_soumis WHERE freelancer_id = ?',
      [freelancerId]
    );
    const total = countResult[0]?.total || 0;

    const [devis] = await db.query(`
      SELECT 
        ds.*,
        dd.type_travaux,
        dd.categorie,
        dd.description as demande_description,
        dd.ville,
        dd.code_postal,
        dd.region,
        dd.prenom as client_prenom,
        dd.nom as client_nom,
        dd.email as client_email,
        dd.telephone as client_telephone,
        dd.statut as demande_statut
      FROM devis_soumis ds
      JOIN demandes_devis dd ON ds.demande_devis_id = dd.id
      WHERE ds.freelancer_id = ?
      ORDER BY ds.date_soumission DESC
      LIMIT ? OFFSET ?
    `, [freelancerId, limit, offset]);

    res.json({
      success: true,
      data: devis,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });

  } catch (error) {
    console.error('Erreur récupération mes devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos devis'
    });
  }
};

// Récupérer TOUS les devis soumis pour l'ADMIN avec pagination (20 par page)
exports.getAllDevisSoumisAdmin = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { statut } = req.query;

    let countQuery = 'SELECT COUNT(*) as total FROM devis_soumis';
    let dataQuery = `
      SELECT 
        ds.*,
        dd.type_travaux,
        dd.categorie,
        dd.ville,
        dd.code_postal,
        dd.prenom as client_prenom,
        dd.nom as client_nom,
        dd.email as client_email,
        dd.telephone as client_telephone,
        u.prenom as freelancer_prenom,
        u.nom as freelancer_nom,
        u.email as freelancer_email,
        u.telephone as freelancer_telephone,
        u.denomination as freelancer_company,
        emp.role as author_role,
        emp.nom as author_nom,
        emp.prenom as author_prenom,
        emp.denomination as author_denomination
      FROM devis_soumis ds
      JOIN demandes_devis dd ON ds.demande_devis_id = dd.id
      JOIN users u ON ds.freelancer_id = u.id
      LEFT JOIN (
          SELECT email, role, nom, prenom, denomination 
          FROM users 
          WHERE role = 'employer' OR role = 'freelancer'
          GROUP BY email
      ) emp ON dd.email = emp.email
    `;

    const queryParams = [];
    const countParams = [];

    if (statut) {
      countQuery += ' WHERE statut = ?';
      dataQuery += ' WHERE ds.statut = ?';
      countParams.push(statut);
      queryParams.push(statut);
    }

    dataQuery += ' ORDER BY ds.date_soumission DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    const [devisList] = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: devisList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });

  } catch (error) {
    console.error('Erreur récupération devis admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis administrateur'
    });
  }
};

module.exports = exports;

exports.getDevisRecusEmployer = async (req, res) => {
  try {
    const employerEmail = req.user.email;
    if (!employerEmail) {
      return res.status(400).json({ success: false, message: 'Email manquant' });
    }

    const [devis] = await db.query(
      `SELECT ds.*, 
              d.type_travaux, d.categorie, d.description as demande_description,
              u.nom as freelancer_nom, u.prenom as freelancer_prenom, u.email as freelancer_email
       FROM devis_soumis ds
       JOIN demandes_devis d ON ds.demande_devis_id = d.id
       JOIN users u ON ds.freelancer_id = u.id
       WHERE d.email = ?
       ORDER BY ds.created_at DESC`,
      [employerEmail]
    );

    res.json({
      success: true,
      data: devis
    });
  } catch (error) {
    console.error('Erreur getDevisRecusEmployer:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.marquerCommeLu = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE devis_soumis SET lu_par_client = 1, date_lecture = NOW() WHERE id = ? AND lu_par_client = 0',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur marquerCommeLu:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Assistant de tarification IA
exports.suggestPrice = async (req, res) => {
  try {
    const { demande_devis_id } = req.body;
    if (!demande_devis_id) return res.status(400).json({ success: false, message: 'demande_devis_id requis' });

    const [demandes] = await req.db.query('SELECT * FROM demandes_devis WHERE id = ?', [demande_devis_id]);
    if (!demandes || demandes.length === 0) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    const demande = demandes[0];

    const promptText = `Tu es un expert en tarification B2B en Belgique.
Le freelance souhaite répondre à cette demande de devis :
Titre : ${demande.type_travaux}
Description : ${demande.description}
Budget estimé client : ${demande.budget_estime || 'Non précisé'}

Donne UNIQUEMENT un objet JSON avec la tarification suggérée :
{
  "min": 400,
  "max": 600,
  "suggestion": 500,
  "reason": "Explication très courte (1 phrase) du pourquoi ce prix."
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const aiRes = await fetch('https://ai.lestagiaire.be/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('admin:QmO2u1QfB99Zloha4Q').toString('base64')
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'cv-ai',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.5
      })
    });
    clearTimeout(timeoutId);

    const aiData = await aiRes.json();
    let resultJson = null;
    if (aiData && aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
      const content = aiData.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) resultJson = JSON.parse(jsonMatch[0]);
    }

    if (resultJson && resultJson.suggestion) {
      return res.json({ success: true, data: resultJson });
    } else {
      throw new Error("Invalid AI response");
    }

  } catch (error) {
    console.error('Erreur Assistant de tarification:', error.message);
    res.json({
      success: true,
      data: { min: 300, max: 700, suggestion: 500, reason: 'Estimation standard basée sur les prix moyens du marché belge.' }
    });
  }
};
