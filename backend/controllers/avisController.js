const db = require('../config/database');
const { sendEmail, getAdminEmails } = require('../config/email');
const notificationService = require('../services/notificationService');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const starsText = (note) => '★'.repeat(parseInt(note) || 0) + '☆'.repeat(5 - (parseInt(note) || 0));

const emailShell = ({ title, pretitle = 'Indebel', children, ctaLabel, ctaUrl }) => `
  <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f6f8fc;padding:24px;color:#0f172a">
    <div style="background:#2A4DEF;color:#fff;border-radius:18px;padding:26px;margin-bottom:18px">
      <p style="margin:0 0 8px;color:#fecaca;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">${pretitle}</p>
      <h2 style="margin:0;font-size:24px;line-height:1.25">${title}</h2>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px">
      ${children}
      ${ctaLabel && ctaUrl ? `<p style="margin-top:22px"><a href="${ctaUrl}" style="background:#c02525;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:800;display:inline-block">${ctaLabel}</a></p>` : ''}
    </div>
    <p style="color:#64748b;font-size:13px;margin-top:18px">Cordialement,<br>L'équipe Indebel</p>
  </div>
`;

const notifyAdmins = async (type, titre, message, data = null) => {
  const [admins] = await db.query('SELECT id FROM users WHERE role = "admin"');
  await Promise.allSettled(admins.map((admin) =>
    notificationService.createNotification(admin.id, type, titre, message, data)
  ));
};

// ─── PUBLIC: Lister tous les freelancers avec leur note moyenne ───────────────
exports.listFreelancers = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchParam = `%${search}%`;

    const [freelancers] = await db.query(
      `SELECT 
        u.id, u.prenom, u.nom, u.email, u.photo_profil, u.secteur,
        u.pays_code, u.a_propos, u.competences, u.image_couverture,
        COALESCE(AVG(ap.note), 0) as note_moyenne,
        COUNT(ap.id) as total_avis
       FROM users u
       LEFT JOIN avis_particuliers ap ON ap.freelancer_id = u.id AND ap.statut = 'public'
       WHERE u.role = 'freelancer'
         
         AND (u.prenom LIKE ? OR u.nom LIKE ? OR u.secteur LIKE ?)
       GROUP BY u.id
       ORDER BY note_moyenne DESC, total_avis DESC
       LIMIT ? OFFSET ?`,
      [searchParam, searchParam, searchParam, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(DISTINCT u.id) as total FROM users u
       WHERE u.role = 'freelancer' 
         AND (u.prenom LIKE ? OR u.nom LIKE ? OR u.secteur LIKE ?)`,
      [searchParam, searchParam, searchParam]
    );

    res.json({
      success: true,
      data: freelancers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUBLIC: Avis d'un freelancer spécifique ─────────────────────────────────
exports.getFreelancerAvis = async (req, res, next) => {
  try {
    const { freelancer_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 10, 100);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const [avis] = await db.query(
      `SELECT id, nom_auteur, note, commentaire, created_at
       FROM avis_particuliers
       WHERE freelancer_id = ? AND statut = 'public'
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [freelancer_id, safeLimit, offset]
    );

    const [[stats]] = await db.query(
      `SELECT COALESCE(AVG(note), 0) as note_moyenne, COUNT(*) as total
       FROM avis_particuliers WHERE freelancer_id = ? AND statut = 'public'`,
      [freelancer_id]
    );

    res.json({
      success: true,
      data: avis,
      stats,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: stats.total || 0,
        pages: Math.ceil((stats.total || 0) / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── FREELANCER: Avis reçus depuis la page avis particuliers ────────────────
exports.getMyAvis = async (req, res, next) => {
  try {
    const freelancerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 20, 100);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const [avis] = await db.query(
      `SELECT id, nom_auteur, email_auteur, note, commentaire, statut, created_at, updated_at
       FROM avis_particuliers
       WHERE freelancer_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [freelancerId, safeLimit, offset]
    );

    const [[stats]] = await db.query(
      `SELECT
         COUNT(*) as total_avis,
         COALESCE(AVG(note), 0) as note_moyenne,
         SUM(CASE WHEN note = 5 THEN 1 ELSE 0 END) as cinq_etoiles,
         SUM(CASE WHEN statut = 'public' THEN 1 ELSE 0 END) as avis_publics
       FROM avis_particuliers
       WHERE freelancer_id = ?`,
      [freelancerId]
    );

    const [distribution] = await db.query(
      `SELECT note, COUNT(*) as count
       FROM avis_particuliers
       WHERE freelancer_id = ?
       GROUP BY note
       ORDER BY note DESC`,
      [freelancerId]
    );

    res.json({
      success: true,
      data: {
        avis,
        stats,
        distribution,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: stats.total_avis || 0,
          pages: Math.ceil((stats.total_avis || 0) / safeLimit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUBLIC: Soumettre un avis ────────────────────────────────────────────────
exports.createAvis = async (req, res, next) => {
  try {
    const { freelancer_id, nom_auteur, email_auteur, note, commentaire } = req.body;

    if (!freelancer_id || !nom_auteur || !note || !commentaire) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }
    if (note < 1 || note > 5) {
      return res.status(400).json({ success: false, message: 'La note doit être entre 1 et 5' });
    }

    // Vérifier que le freelancer existe
    const [[freelancer]] = await db.query(
      'SELECT id, prenom, nom, email FROM users WHERE id = ? AND role = "freelancer"',
      [freelancer_id]
    );
    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Prestataire non trouvé' });
    }

    const [result] = await db.query(
      'INSERT INTO avis_particuliers (freelancer_id, nom_auteur, email_auteur, note, commentaire) VALUES (?, ?, ?, ?, ?)',
      [freelancer_id, nom_auteur.trim(), email_auteur?.trim() || null, parseInt(note), commentaire.trim()]
    );

    const freelancerName = `${freelancer.prenom} ${freelancer.nom}`;
    const cleanAuthor = escapeHtml(nom_auteur.trim());
    const cleanComment = escapeHtml(commentaire.trim());
    const cleanFreelancerName = escapeHtml(freelancerName);
    const cleanStars = starsText(note);
    const adminEmail = getAdminEmails();

    const runSideEffects = async () => {
    // Email à l'auteur de l'avis si son email est renseigné
    if (email_auteur?.trim()) {
      try {
        await sendEmail({
          to: email_auteur.trim(),
          subject: `Votre avis pour ${freelancerName} a bien été reçu`,
          html: emailShell({
            title: 'Votre avis a bien été reçu',
            children: `
              <p>Bonjour <strong>${cleanAuthor}</strong>,</p>
              <p>Merci pour votre retour. Votre avis pour <strong>${cleanFreelancerName}</strong> a bien été enregistré.</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin:18px 0">
                <p style="font-size:26px;color:#c02525;margin:0;text-align:center;letter-spacing:2px">${cleanStars}</p>
                <p style="font-size:18px;font-weight:800;text-align:center;color:#2A4DEF;margin:8px 0">${parseInt(note)}/5</p>
                <p style="color:#334155;margin:0;font-style:italic">"${cleanComment}"</p>
              </div>
            `
          })
        });
      } catch (e) { console.error('Email auteur avis:', e.message); }
    }

    // Email au prestataire
    try {
      await sendEmail({
        to: freelancer.email,
        subject: `⭐ Nouvel avis reçu sur votre profil — ${parseInt(note)}/5`,
        html: emailShell({
          title: 'Nouvel avis particulier reçu',
          children: `
            <p>Bonjour <strong>${cleanFreelancerName}</strong>,</p>
            <p><strong>${cleanAuthor}</strong> vient de laisser un avis sur votre profil.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin:18px 0">
              <p style="font-size:26px;color:#c02525;margin:0;text-align:center;letter-spacing:2px">${cleanStars}</p>
              <p style="font-size:18px;font-weight:800;text-align:center;color:#2A4DEF;margin:8px 0">${parseInt(note)}/5</p>
              <p style="color:#334155;margin:0;font-style:italic">"${cleanComment}"</p>
            </div>
          `,
          ctaLabel: 'Voir mes avis de particuliers',
          ctaUrl: `${process.env.FRONTEND_URL}/freelancer/evaluations-particulier`
        })
      });
    } catch (e) { console.error('Email prestataire:', e.message); }

    // Email à l'admin
    try {
      await sendEmail({
        to: adminEmail,
        subject: `[Admin] Nouvel avis particulier — ${freelancerName}`,
        html: emailShell({
          title: 'Nouvel avis particulier soumis',
          children: `
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><b>Prestataire</b></td><td>${cleanFreelancerName}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><b>Auteur</b></td><td>${cleanAuthor} ${email_auteur ? `(${escapeHtml(email_auteur)})` : ''}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><b>Note</b></td><td>${parseInt(note)}/5 ${cleanStars}</td></tr>
              <tr><td style="padding:8px"><b>Commentaire</b></td><td>${cleanComment}</td></tr>
            </table>
          `,
          ctaLabel: 'Gérer les avis',
          ctaUrl: `${process.env.FRONTEND_URL}/admin/avis-prestataires`
        })
      });
    } catch (e) { console.error('Email admin:', e.message); }

    // Notification in-app au prestataire
    try {
      await notificationService.createNotification(
        freelancer_id, 'avis',
        `⭐ Nouvel avis : ${note}/5`,
        `${nom_auteur} vous a laissé un avis avec ${note}/5 étoiles.`,
        { avis_id: result.insertId, note, lien: '/freelancer/evaluations-particulier' }
      );
    } catch (e) { console.error('Notification:', e.message); }

    try {
      await notifyAdmins(
        'avis',
        `Nouvel avis particulier : ${note}/5`,
        `${nom_auteur} a laissé un avis à ${freelancerName}.`,
        { avis_id: result.insertId, freelancer_id, note, lien: '/admin/avis-prestataires' }
      );
    } catch (e) { console.error('Notification admin avis:', e.message); }

    };

    res.status(201).json({ success: true, message: 'Avis enregistré avec succès', data: { id: result.insertId } });
    runSideEffects().catch((error) => console.error('Effets secondaires avis:', error.message));
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Lister tous les avis ─────────────────────────────────────────────
exports.adminListAvis = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, search = '', statut = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchParam = `%${search}%`;

    let where = '1=1';
    const params = [];

    if (search) {
      where += ' AND (ap.nom_auteur LIKE ? OR u.prenom LIKE ? OR u.nom LIKE ? OR ap.commentaire LIKE ?)';
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    if (statut) {
      where += ' AND ap.statut = ?';
      params.push(statut);
    }

    const [avis] = await db.query(
      `SELECT ap.*, u.prenom as freelancer_prenom, u.nom as freelancer_nom, u.photo_profil as freelancer_photo
       FROM avis_particuliers ap
       JOIN users u ON ap.freelancer_id = u.id
       WHERE ${where}
       ORDER BY ap.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM avis_particuliers ap JOIN users u ON ap.freelancer_id = u.id WHERE ${where}`,
      params
    );

    res.json({
      success: true,
      data: avis,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Modifier un avis ──────────────────────────────────────────────────
exports.adminUpdateAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, commentaire, statut } = req.body;

    const [[existing]] = await db.query(
      'SELECT note, commentaire, statut FROM avis_particuliers WHERE id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    await db.query(
      'UPDATE avis_particuliers SET note = ?, commentaire = ?, statut = ? WHERE id = ?',
      [
        note ?? existing.note,
        commentaire ?? existing.commentaire,
        statut ?? existing.statut,
        id
      ]
    );

    res.json({ success: true, message: 'Avis mis à jour' });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Supprimer un avis ─────────────────────────────────────────────────
exports.adminDeleteAvis = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM avis_particuliers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Avis supprimé' });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
