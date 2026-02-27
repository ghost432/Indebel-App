const db = require('../config/database');
const { sendEmail } = require('../config/email');

// Créer un nouveau ticket de support
exports.createTicket = async (req, res, next) => {
  try {
    const { sujet, categorie, priorite, message } = req.body;
    const user_id = req.user.id;

    // Validation
    if (!sujet || !message) {
      return res.status(400).json({
        success: false,
        message: 'Le sujet et le message sont requis'
      });
    }

    // Créer le ticket
    const [result] = await db.query(
      `INSERT INTO support_tickets (user_id, sujet, categorie, priorite, message)
             VALUES (?, ?, ?, ?, ?)`,
      [user_id, sujet, categorie || 'autre', priorite || 'normale', message]
    );

    const ticketId = result.insertId;

    // Récupérer les infos de l'utilisateur
    const [users] = await db.query(
      'SELECT nom, prenom, email, denomination, role FROM users WHERE id = ?',
      [user_id]
    );

    const user = users[0];

    // Envoyer notification email aux admins
    try {
      // we use the templates from email.js which are usually exported as emailTemplates
      const { emailTemplates } = require('../config/email');
      if (emailTemplates && emailTemplates.newSupportTicketAdmin) {
        await sendEmail(emailTemplates.newSupportTicketAdmin({
          id: ticketId,
          sujet,
          categorie: categorie || 'autre',
          priorite: priorite || 'normale',
          message
        }, user));
      }
    } catch (emailError) {
      console.error('Erreur envoi email admin:', emailError);
    }

    // Créer notification pour l'utilisateur
    await db.query(
      `INSERT INTO notifications (user_id, titre, message, type, lien)
             VALUES (?, ?, ?, ?, ?)`,
      [
        user_id,
        '✅ Ticket créé',
        `Votre ticket de support #${ticketId} a été créé. Notre équipe vous répondra sous peu.`,
        'success',
        `/support`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Ticket créé avec succès',
      data: {
        ticketId,
        sujet,
        categorie: categorie || 'autre',
        priorite: priorite || 'normale',
        statut: 'ouvert'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir tous les tickets de l'utilisateur connecté
exports.getUserTickets = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { statut, limit = 50 } = req.query;

    let query = `
            SELECT 
                t.id, t.sujet, t.categorie, t.priorite, t.statut, 
                t.message, t.date_creation, t.date_mise_a_jour, t.date_resolution,
                t.admin_id,
                u.nom as admin_nom, u.prenom as admin_prenom,
                (SELECT COUNT(*) FROM support_responses WHERE ticket_id = t.id) as nombre_reponses
            FROM support_tickets t
            LEFT JOIN users u ON t.admin_id = u.id
            WHERE t.user_id = ?
        `;

    const params = [user_id];

    if (statut) {
      query += ' AND t.statut = ?';
      params.push(statut);
    }

    query += ' ORDER BY t.date_mise_a_jour DESC LIMIT ?';
    params.push(parseInt(limit));

    const [tickets] = await db.query(query, params);

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir tous les tickets (ADMIN uniquement)
exports.getAllTickets = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    const { statut, priorite, categorie, limit = 100 } = req.query;

    let query = `
            SELECT 
                t.id, t.user_id, t.sujet, t.categorie, t.priorite, t.statut,
                t.message, t.date_creation, t.date_mise_a_jour, t.date_resolution,
                t.admin_id,
                u.nom, u.prenom, u.email, u.denomination, u.role,
                admin.nom as admin_nom, admin.prenom as admin_prenom,
                (SELECT COUNT(*) FROM support_responses WHERE ticket_id = t.id) as nombre_reponses,
                (SELECT date_creation FROM support_responses WHERE ticket_id = t.id ORDER BY date_creation DESC LIMIT 1) as derniere_reponse
            FROM support_tickets t
            INNER JOIN users u ON t.user_id = u.id
            LEFT JOIN users admin ON t.admin_id = admin.id
            WHERE 1=1
        `;

    const params = [];

    if (statut) {
      query += ' AND t.statut = ?';
      params.push(statut);
    }

    if (priorite) {
      query += ' AND t.priorite = ?';
      params.push(priorite);
    }

    if (categorie) {
      query += ' AND t.categorie = ?';
      params.push(categorie);
    }

    query += ' ORDER BY t.priorite DESC, t.date_mise_a_jour DESC LIMIT ?';
    params.push(parseInt(limit));

    const [tickets] = await db.query(query, params);

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir un ticket spécifique avec ses réponses
exports.getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [tickets] = await db.query(
      `SELECT 
                t.*,
                u.nom, u.prenom, u.email, u.denomination, u.role, u.photo_profil,
                admin.nom as admin_nom, admin.prenom as admin_prenom, admin.photo_profil as admin_photo
            FROM support_tickets t
            INNER JOIN users u ON t.user_id = u.id
            LEFT JOIN users admin ON t.admin_id = admin.id
            WHERE t.id = ?`,
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    const ticket = tickets[0];

    if (!isAdmin && ticket.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    const [responses] = await db.query(
      `SELECT 
                r.*,
                u.nom, u.prenom, u.email, u.photo_profil, u.role
            FROM support_responses r
            INNER JOIN users u ON r.user_id = u.id
            WHERE r.ticket_id = ?
            ORDER BY r.date_creation ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ticket,
        responses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Ajouter une réponse à un ticket
exports.addResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user_id = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Le message est requis'
      });
    }

    const [tickets] = await db.query(
      'SELECT user_id, sujet, statut FROM support_tickets WHERE id = ?',
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    const ticket = tickets[0];

    if (!isAdmin && ticket.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    await db.query(
      `INSERT INTO support_responses (ticket_id, user_id, message, est_admin)
             VALUES (?, ?, ?, ?)`,
      [id, user_id, message, isAdmin ? 1 : 0]
    );

    let newStatut = ticket.statut;
    if (isAdmin && ticket.statut === 'ouvert') {
      newStatut = 'en_cours';
      await db.query(
        'UPDATE support_tickets SET statut = ?, admin_id = ? WHERE id = ?',
        ['en_cours', user_id, id]
      );
    } else {
      await db.query(
        'UPDATE support_tickets SET date_mise_a_jour = NOW() WHERE id = ?',
        [id]
      );
    }

    try {
      if (isAdmin || !isAdmin) { // Logic simplified for notification
        const [recipient] = await db.query(
          'SELECT email, nom, prenom, denomination FROM users WHERE id = ?',
          [isAdmin ? ticket.user_id : ticket.user_id] // Simplified
        );

        if (isAdmin) {
          await sendEmail({
            to: recipient[0].email,
            subject: `💬 Réponse à votre ticket #${id}`,
            html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #667eea;">Nouvelle réponse à votre ticket</h2>
                                <p>Bonjour ${recipient[0].prenom || recipient[0].denomination},</p>
                                <p>Notre équipe support a répondu à votre ticket <strong>#${id}</strong> : ${ticket.sujet}</p>
                                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="white-space: pre-wrap; color: #1f2937;">${message}</p>
                                </div>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${process.env.FRONTEND_URL}/support/${id}" 
                                       style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                        Voir le ticket
                                    </a>
                                </div>
                                <p>Cordialement,<br/>L'équipe Indebel</p>
                            </div>
                        `
          });
        } else {
          const [admins] = await db.query("SELECT email FROM users WHERE role = 'admin'");
          for (const admin of admins) {
            await sendEmail({
              to: admin.email,
              subject: `💬 Nouvelle réponse au ticket #${id}`,
              html: `<p>L'utilisateur a répondu au ticket <strong>#${id}</strong></p>`
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
    }

    const notifUserId = isAdmin ? ticket.user_id : user_id;
    await db.query(
      `INSERT INTO notifications (user_id, titre, message, type, lien)
             VALUES (?, ?, ?, ?, ?)`,
      [
        notifUserId,
        isAdmin ? '💬 Réponse à votre ticket' : '💬 Message envoyé',
        isAdmin ? `Notre équipe a répondu à votre ticket #${id}` : `Votre message a été envoyé`,
        'info',
        isAdmin ? `/support/${id}` : `/admin/support/${id}`
      ]
    );

    res.json({ success: true, message: 'Réponse ajoutée', data: { statut: newStatut } });
  } catch (error) {
    next(error);
  }
};

exports.updateTicketStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès refusé' });
    const { id } = req.params;
    const { statut, admin_id } = req.body;

    await db.query(
      `UPDATE support_tickets SET statut = ?, admin_id = COALESCE(?, admin_id), 
             date_resolution = ${['resolu', 'ferme'].includes(statut) ? 'NOW()' : 'date_resolution'}
             WHERE id = ?`,
      [statut, admin_id || null, id]
    );

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const isAdmin = req.user.role === 'admin';
    let count = 0;
    if (isAdmin) {
      const [result] = await db.query("SELECT COUNT(*) as count FROM support_tickets WHERE statut IN ('ouvert', 'en_cours')");
      count = result[0].count;
    } else {
      const [result] = await db.query("SELECT COUNT(*) as count FROM support_tickets WHERE user_id = ? AND statut != 'ferme'", [user_id]);
      count = result[0].count;
    }
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

exports.getSupportStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès refusé' });
    const [total] = await db.query('SELECT COUNT(*) as total FROM support_tickets');
    const [byStatus] = await db.query('SELECT statut, COUNT(*) as count FROM support_tickets GROUP BY statut');
    res.json({ success: true, data: { total: total[0].total, byStatus } });
  } catch (error) {
    next(error);
  }
};
