const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { sendEmail, getAdminEmails } = require('../config/email');
const { checkDevisViewAccess, sendLimitReached } = require('../services/devisViewLimitService');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const publicHomeUrl = () => process.env.PUBLIC_SITE_URL || 'https://indebel.be';
const appUrl = () => process.env.FRONTEND_URL || 'http://localhost:5175';

const canViewRequestContacts = (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = String(decoded.role || '').toLowerCase();
    return ['freelancer', 'admin'].includes(role);
  } catch (error) {
    return false;
  }
};


const getAuthenticatedUserFromRequest = (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

const recordDevisPageView = async (req, demandeId, source = 'public_detail') => {
  const user = getAuthenticatedUserFromRequest(req);
  if (!user || !user.id) return null;

  const ip = String(req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').split(',')[0].trim().slice(0, 80);
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 255);

  try {
    await db.query(
      `INSERT INTO devis_page_views (demande_devis_id, user_id, ip_address, user_agent, source)
       VALUES (?, ?, ?, ?, ?)`,
      [demandeId, user.id, ip || null, userAgent || null, source]
    );
  } catch (error) {
    console.error('Erreur enregistrement vue devis:', error.message);
  }

  return user;
};

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

    // Rechercher les prestataires ayant des secteurs d'activite renseignes.
    const [freelancers] = await db.query(`
      SELECT DISTINCT u.id, u.nom, u.prenom, u.email, u.telephone,
             u.competences, u.secteur as secteurs_activite
      FROM users u
      WHERE u.role = 'freelancer'
        AND u.secteur IS NOT NULL
    `);

    const matchedFreelancers = freelancers
      .map(freelancer => {
        const secteurs = parseList(freelancer.secteurs_activite).map(normalize);
        const hasSectorMatch = demandeSecteurs.some(secteur => secteurs.some(s => s === secteur));

        return {
          ...freelancer,
          score: hasSectorMatch ? 100 : 0
        };
      })
      .filter(f => f.score > 0);

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
      fichiers_joints,
      lieu_travaux,
      travaux_adresse,
      travaux_code_postal,
      travaux_ville,
      travaux_region,
      province
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

    // Check employer credit limit
    const [employers] = await db.query(
      'SELECT id, solde_credits FROM users WHERE email = ? AND role = "employer"',
      [email]
    );
    let employerId = null;
    let cout_demandes_devis = 0;
    
    if (employers.length > 0) {
      employerId = employers[0].id;
      const solde_credits = employers[0].solde_credits || 0;
      
      const [settingsRows] = await db.query('SELECT setting_value FROM site_settings WHERE setting_key = "cout_demandes_devis"');
      cout_demandes_devis = settingsRows.length > 0 ? parseInt(settingsRows[0].setting_value, 10) : 1;
      
      if (solde_credits < cout_demandes_devis) {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: `Crédits insuffisants. Il vous faut ${cout_demandes_devis} crédits pour créer cette demande. Veuillez recharger votre portefeuille.`
        });
      }
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
        (urgence === 'normale' || urgence === 'normal') ? 'normal' : (urgence === 'urgente' ? 'urgente' : 'normal'),
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

    // Deduct credits if applicable
    if (employerId && cout_demandes_devis > 0) {
      await db.query('UPDATE users SET solde_credits = solde_credits - ? WHERE id = ?', [cout_demandes_devis, employerId]);
      await db.query(`INSERT INTO historique_credits (user_id, type, montant, description) VALUES (?, "depense", ?, "Création d'une demande de devis")`, [employerId, cout_demandes_devis]);
    }

    // Envoyer email de confirmation au client
    try {
      await sendEmail({
        to: email,
        subject: '✅ Votre demande de devis a été reçue - Indebel',
        text: `Bonjour ${prenom} ${nom},\n\nNous avons bien reçu votre demande de devis pour: ${type_travaux}\n\nLocalisation: ${adresse}, ${code_postal} ${ville}\n\nNotre équipe va examiner votre demande et la publier, des prestataires pourront vous contacter en envoyant des devis pour votre demande.\n\nNuméro de demande: #${result.insertId}\n\nCordialement,\nL'équipe Indebel`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#f6f8fc;">
          <div style="background: #082151; padding: 30px; text-align: center; border-radius: 18px 18px 0 0;">
            <h1 style="color: white; margin: 0;">Demande reçue</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top:0;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${escapeHtml(prenom)} ${escapeHtml(nom)}</strong>,</p>
            
            <p style="color: #6b7280;">Nous avons bien reçu votre demande de devis.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #082151;">Détails de votre demande</h3>
              <p style="margin: 5px 0;"><strong>Type de travaux:</strong> ${escapeHtml(type_travaux)}</p>
              <p style="margin: 5px 0;"><strong>Secteur:</strong> ${escapeHtml(categorie || 'Non précisé')}</p>
              <p style="margin: 5px 0;"><strong>Priorité:</strong> ${escapeHtml(urgence || 'normal')}</p>
              <p style="margin: 5px 0;"><strong>Localisation:</strong> ${escapeHtml(adresse)}, ${escapeHtml(code_postal)} ${escapeHtml(ville)}</p>
              <p style="margin: 5px 0;"><strong>Numéro de demande:</strong> #${result.insertId}</p>
            </div>
            
            <p style="color: #6b7280;">Notre équipe va examiner votre demande et la publier, des prestataires pourront vous contacter en envoyant des devis pour votre demande.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${publicHomeUrl()}" 
                 style="background: #c02525; color: white; padding: 12px 30px; text-decoration: none; border-radius: 999px; display: inline-block; font-weight:700;">
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
        text: `Une nouvelle demande de devis a été soumise.\n\nClient: ${prenom} ${nom}\nEmail: ${email}\nType: ${type_travaux}\nPriorité: ${urgence || 'normal'}\nVille: ${ville}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🆕 Nouvelle demande de devis</h2>
          <p><strong>Numéro:</strong> #${result.insertId}</p>
          <p><strong>Client:</strong> ${escapeHtml(prenom)} ${escapeHtml(nom)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Type:</strong> ${escapeHtml(type_travaux)}</p>
          <p><strong>Secteur:</strong> ${escapeHtml(categorie || 'Non précisé')}</p>
          <p><strong>Priorité:</strong> ${escapeHtml(urgence || 'normal')}</p>
          <p><strong>Ville:</strong> ${escapeHtml(ville)}</p>
          <a href="${appUrl()}/admin/devis" 
             style="background: #082151; color: white; padding: 10px 20px; text-decoration: none; border-radius: 999px; display: inline-block;">
            Voir la demande
          </a>
        </div>
        `
      });

      const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        await db.query(
          'INSERT INTO notifications (user_id, type, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
          [
            admin.id,
            'devis_validation',
            'Nouvelle demande de devis',
            `Nouvelle demande #${result.insertId} de ${prenom} ${nom} à ${ville}.`,
            '/admin/devis'
          ]
        );
      }
    } catch (notifyError) {
      console.error('Erreur notification admin:', notifyError);
    }

    // Les prestataires seront notifiés une fois la demande validée par l'administrateur (dans validerDemande)

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
      message: 'Erreur lors de la création de la demande de devis',
      error: error.message
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

    if (req.user && req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      const subAdminCondition = '(d.email IN (SELECT email FROM users WHERE created_by = ? OR id = ?))';
      if (whereClause) {
        whereClause += ' AND ' + subAdminCondition;
      } else {
        whereClause = 'WHERE ' + subAdminCondition;
      }
      params.push(req.user.id, req.user.id);
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
          SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as termine,
          SUM(CASE WHEN statut = 'devis_complet' THEN 1 ELSE 0 END) as devis_complet,
          SUM(CASE WHEN statut = 'retire_liste' THEN 1 ELSE 0 END) as retire_liste
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
              d.description,
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
              d.details_complementaires,
              -- d.fichiers_joints, (Exclu, très lourd)
              d.statut,
              d.commentaire_admin,
              d.traite_par,
              d.date_validation,
              d.created_at,
              d.updated_at,
              u.prenom as admin_prenom, 
              u.nom as admin_nom,
              emp.role as author_role,
              emp.nom as author_nom,
              emp.prenom as author_prenom,
              emp.denomination as author_denomination,
              COALESCE((
                SELECT COUNT(*) 
                FROM devis_soumis ds 
                WHERE ds.demande_devis_id = d.id
              ), 0) as nb_devis_soumis
       FROM demandes_devis d
       LEFT JOIN users u ON d.traite_par = u.id
       LEFT JOIN (
           SELECT email, role, nom, prenom, denomination 
           FROM users 
           WHERE role = 'employer' OR role = 'freelancer'
           GROUP BY email
       ) emp ON d.email = emp.email
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
        SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) as termine,
        SUM(CASE WHEN statut = 'devis_complet' THEN 1 ELSE 0 END) as devis_complet,
        SUM(CASE WHEN statut = 'retire_liste' THEN 1 ELSE 0 END) as retire_liste
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
        ...normalizeDevisFiles(demandes[0]),
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
                  <p><strong>Secteur:</strong> ${demandeData.categorie || demandeData.type_travaux || 'Non spécifié'}</p>
                  <p><strong>Localisation:</strong> ${demandeData.ville}, ${demandeData.region}</p>
                  <p><strong>Budget estimé:</strong> ${demandeData.budget_estime ? demandeData.budget_estime + ' €' : 'Non communiqué'}</p>
                  <p><strong>Date début souhaitée:</strong> ${demandeData.date_souhaite || 'Non spécifiée'}</p>
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

// Enlever une demande des listes publiques/prestataires sans la supprimer (admin)
exports.marquerRetireeListe = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [result] = await db.query(
      `UPDATE demandes_devis 
       SET statut = 'retire_liste', traite_par = ?
       WHERE id = ?`,
      [adminId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Demande enlevée de la liste'
    });

  } catch (error) {
    console.error('Erreur retrait liste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait de la liste'
    });
  }
};

// Marquer une demande de devis comme terminée (Recruteur propriétaire ou Admin)
exports.marquerTerminee = async (req, res) => {
  try {
    const { id } = req.params;

    let query = `UPDATE demandes_devis SET statut = 'termine' WHERE id = ?`;
    let params = [id];

    if (req.user && req.user.role !== 'admin') {
      query = `UPDATE demandes_devis SET statut = 'termine' WHERE id = ? AND email = ?`;
      params = [id, req.user.email];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée ou non autorisée'
      });
    }

    res.json({
      success: true,
      message: 'Demande de devis marquée comme terminée avec succès'
    });
  } catch (error) {
    console.error('Erreur marquerTerminee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
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

    // 1. Récupérer la demande avant suppression pour identifier le recruteur et les prestataires
    const [demandes] = await db.query('SELECT * FROM demandes_devis WHERE id = ?', [id]);

    if (demandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande de devis non trouvée'
      });
    }

    const demande = demandes[0];

    // 2. Notifier le recruteur (propriétaire de la demande)
    if (demande.email) {
      const [recruiterRows] = await db.query('SELECT id FROM users WHERE email = ?', [demande.email]);
      if (recruiterRows.length > 0) {
        const recruiterId = recruiterRows[0].id;
        const titreDevis = demande.type_travaux || demande.categorie || `Demande #${id}`;
        await db.query(
          'INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) VALUES (?, ?, ?, ?, ?, FALSE, NOW())',
          [
            recruiterId,
            'warning',
            '🗑️ Demande de devis supprimée par l\'administration',
            `Votre demande de devis "${titreDevis}" a été supprimée par l'administration. Elle n'apparaîtra plus dans votre compte.`,
            '/employer/devis'
          ]
        );
      }
    }

    // 3. Notifier les prestataires qui avaient soumis un devis pour cette demande
    const [devisSoumisRows] = await db.query(
      'SELECT DISTINCT freelancer_id FROM devis_soumis WHERE demande_devis_id = ?',
      [id]
    );

    for (const item of devisSoumisRows) {
      if (item.freelancer_id) {
        await db.query(
          'INSERT INTO notifications (user_id, type, titre, message, lien, lu, date_creation) VALUES (?, ?, ?, ?, ?, FALSE, NOW())',
          [
            item.freelancer_id,
            'info',
            'ℹ️ Demande de devis supprimée',
            `La demande de devis "${demande.type_travaux || 'associée'}" pour laquelle vous aviez soumis une offre a été supprimée par l'administration.`,
            '/freelancer/devis'
          ]
        );
      }
    }

    // 4. Supprimer la demande de devis
    await db.query('DELETE FROM demandes_devis WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Demande supprimée avec succès et notifications créées'
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
    const contactVisible = canViewRequestContacts(req);

    // 1. Récupérer d'abord les IDs pour la pagination (optimisation mémoire)
    const [idResults] = await db.query(
      `SELECT dd.id,
              COALESCE((
                SELECT COUNT(*) 
                FROM devis_soumis ds 
                WHERE ds.demande_devis_id = dd.id
              ), 0) as nb_devis_soumis
       FROM demandes_devis dd
       WHERE dd.statut IN ('valide', 'traite', 'devis_complet')
       AND dd.date_validation IS NOT NULL
       HAVING nb_devis_soumis < 5
       ORDER BY dd.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    // Compter le total (pour la pagination)
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM demandes_devis dd
       WHERE dd.statut IN ('valide', 'traite', 'devis_complet')
       AND dd.date_validation IS NOT NULL
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
              dd.email,
              dd.telephone,
              dd.date_souhaite, 
              dd.heure_souhaite,
              dd.budget_estime, 
              dd.details_complementaires, 
              dd.statut,
              NULL as fichiers_joints,
              dd.created_at,
              COALESCE((
                SELECT COUNT(*) 
                FROM devis_soumis ds 
                WHERE ds.demande_devis_id = dd.id
              ), 0) as nb_devis_soumis
       FROM demandes_devis dd
       WHERE dd.id IN (?)
       AND dd.statut IN ('valide', 'traite', 'devis_complet')
       AND dd.date_validation IS NOT NULL
       ORDER BY dd.created_at DESC`,
      [devisIds]
    );

    const formattedDemandes = demandes.map(demande => ({
      ...demande,
      contact_visible: contactVisible,
      contact_message: contactVisible ? null : 'Connectez-vous pour voir ces informations',
      email: contactVisible ? demande.email : null,
      telephone: contactVisible ? demande.telephone : null,
      adresse: contactVisible ? demande.adresse : null
    }));

    res.json({
      success: true,
      data: formattedDemandes,
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


// Récupérer le détail public d'une demande, avec tracking des vues connectées
exports.getPublicDemandeById = async (req, res) => {
  try {
    const { id } = req.params;
    const contactVisible = canViewRequestContacts(req);
    const [demandes] = await db.query(
      `SELECT dd.id, dd.type_travaux, dd.categorie, dd.description, dd.urgence,
              dd.statut,
              dd.ville, dd.region, dd.code_postal, dd.adresse, dd.email, dd.telephone,
              dd.prenom, dd.nom,
              dd.date_souhaite, dd.heure_souhaite, dd.budget_estime, dd.details_complementaires,
              dd.fichiers_joints, dd.created_at,
              COALESCE((SELECT COUNT(*) FROM devis_soumis ds WHERE ds.demande_devis_id = dd.id), 0) as nb_devis_soumis
       FROM demandes_devis dd
       WHERE dd.id = ?`,
      [id]
    );

    if (!demandes.length) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée ou indisponible' });
    }

    const authenticatedUser = getAuthenticatedUserFromRequest(req);
    const isLimitedFreelancer = contactVisible && authenticatedUser && authenticatedUser.role === 'freelancer';
    const access = isLimitedFreelancer
      ? await checkDevisViewAccess({ ...req, user: authenticatedUser }, id)
      : { allowed: true, limited: false };

    if (!access.allowed) {
      return sendLimitReached(res, access);
    }

    if (contactVisible) {
      await recordDevisPageView(req, id, 'public_detail');
    }

    const demande = normalizeDevisFiles(demandes[0]);

    res.json({
      success: true,
      data: {
        ...demande,
        contact_visible: contactVisible,
        contact_message: contactVisible ? null : 'Connectez-vous pour voir ces informations',
        email: contactVisible ? demande.email : null,
        telephone: contactVisible ? demande.telephone : null,
        adresse: contactVisible ? demande.adresse : null,
        prenom: contactVisible ? demande.prenom : null,
        nom: contactVisible ? demande.nom : null,
        login_url: `${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/login`,
        quota: access.limited ? {
          limit: access.limit,
          viewed_count: access.alreadyViewedCurrent ? access.viewedCount : access.viewedCount + 1,
          forfait: access.forfait
        } : null
      }
    });
  } catch (error) {
    console.error('Erreur récupération détail public demande:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la demande' });
  }
};

// Vérifier rapidement le statut public sans consommer le quota de visualisation
exports.getPublicDemandeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT id, type_travaux, statut
       FROM demandes_devis
       WHERE id = ?
       AND statut IN ('valide', 'traite', 'devis_complet')
       AND date_validation IS NOT NULL`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée ou indisponible' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Erreur récupération statut public demande:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la vérification de la demande' });
  }
};

// Visibilité d'une demande de devis (admin)
exports.getDevisVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    const [demandes] = await db.query(
      'SELECT id, type_travaux, ville, region, created_at FROM demandes_devis WHERE id = ?',
      [id]
    );

    if (!demandes.length) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const [summaryRows] = await db.query(
      `SELECT COUNT(*) as total_views,
              COUNT(DISTINCT user_id) as unique_viewers,
              MAX(viewed_at) as last_viewed_at
       FROM devis_page_views
       WHERE demande_devis_id = ?`,
      [id]
    );

    const [viewers] = await db.query(
      `SELECT v.user_id,
              u.prenom,
              u.nom,
              u.email,
              u.role,
              u.denomination,
              COUNT(*) as views_count,
              MIN(v.viewed_at) as first_viewed_at,
              MAX(v.viewed_at) as last_viewed_at
       FROM devis_page_views v
       JOIN users u ON u.id = v.user_id
       WHERE v.demande_devis_id = ?
       GROUP BY v.user_id, u.prenom, u.nom, u.email, u.role, u.denomination
       ORDER BY last_viewed_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        demande: demandes[0],
        summary: {
          total_views: Number(summaryRows[0]?.total_views || 0),
          unique_viewers: Number(summaryRows[0]?.unique_viewers || 0),
          last_viewed_at: summaryRows[0]?.last_viewed_at || null
        },
        viewers: viewers.map(viewer => ({
          ...viewer,
          display_name: [viewer.prenom, viewer.nom].filter(Boolean).join(' ') || viewer.denomination || viewer.email || `Utilisateur #${viewer.user_id}`,
          views_count: Number(viewer.views_count || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Erreur récupération visibilité devis:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la visibilité' });
  }
};

// Récupérer les statistiques des devis (admin)
exports.getDevisStats = async (req, res) => {
  try {
    let whereClause = '';
    const params = [];

    if (req.user && req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      whereClause = 'WHERE email IN (SELECT email FROM users WHERE created_by = ? OR id = ?)';
      params.push(req.user.id, req.user.id);
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valide,
        SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as refuse,
        SUM(CASE WHEN statut = 'traite' THEN 1 ELSE 0 END) as traite,
        SUM(CASE WHEN statut = 'devis_complet' THEN 1 ELSE 0 END) as devis_complet,
        SUM(CASE WHEN statut = 'retire_liste' THEN 1 ELSE 0 END) as retire_liste
      FROM demandes_devis
      ${whereClause}
    `, params);

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


exports.marquerAttente = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            `UPDATE demandes_devis
             SET statut = ?, date_validation = NULL, traite_par = NULL
             WHERE id = ?`,
            ['en_attente', id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Demande non trouvée' });
        }
        
        res.json({ success: true, message: 'Demande remise en attente' });
    } catch (error) {
        console.error('Erreur marquerAttente:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise en attente' });
    }
};

exports.getMesDemandes = async (req, res) => {
    try {
        const userEmail = req.user.email;
        if (!userEmail) {
            return res.status(400).json({ success: false, message: 'Email utilisateur non trouvé' });
        }

        const [demandes] = await db.query(
            `SELECT d.*, 
            (SELECT COUNT(*) FROM devis_soumis ds WHERE ds.demande_devis_id = d.id) as total_devis_recus
            FROM demandes_devis d 
            WHERE d.email = ? 
            ORDER BY d.created_at DESC`,
            [userEmail]
        );

        res.json({ success: true, data: demandes });
    } catch (error) {
        console.error('Erreur getMesDemandes:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de vos demandes' });
    }
};
