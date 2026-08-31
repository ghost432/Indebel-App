const db = require('../config/database');
const FactureService = require('../services/factureService');
const path = require('path');
const fs = require('fs');

/**
 * Récupérer toutes les factures d'un utilisateur
 */
exports.getUserFactures = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.user.id;

    const [factures] = await connection.query(
      `SELECT f.*, fo.nom as forfait_nom_actuel, fo.couleur_badge
       FROM factures_forfaits f
       LEFT JOIN forfaits fo ON f.forfait_id = fo.id
       WHERE f.user_id = ?
       ORDER BY f.date_creation DESC`,
      [userId]
    );

    res.json({
      success: true,
      factures
    });

  } catch (error) {
    console.error('Erreur getUserFactures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures'
    });
  } finally {
    connection.release();
  }
};

/**
 * Récupérer toutes les factures (Admin - Crédits Uniquement)
 */
exports.getAllFactures = async (req, res) => {
  const connection = await db.getConnection();

  try {
    let query = `
      SELECT f.*, 
              u.nom as user_nom, 
              u.prenom as user_prenom, 
              u.email as user_email,
              fo.nom as forfait_nom_actuel
       FROM factures_forfaits f
       JOIN users u ON f.user_id = u.id
       LEFT JOIN forfaits fo ON f.forfait_id = fo.id
       WHERE 1=1
    `;
    let params = [];
    
    if (req.user && req.user.email !== 'noreply@indebel.be' && req.user.role === 'admin') {
      query += ' AND (u.created_by = ? OR u.id = ?)';
      params = [req.user.id, req.user.id];
    }
    
    query += ' ORDER BY f.date_creation DESC';

    const [factures] = await connection.query(query, params);

    res.json({
      success: true,
      factures
    });

  } catch (error) {
    console.error('Erreur getAllFactures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures'
    });
  } finally {
    connection.release();
  }
};

/**
 * Télécharger une facture PDF
 */
exports.telechargerFacture = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Récupérer la facture
    let query = 'SELECT * FROM factures_forfaits WHERE id = ?';
    let params = [id];

    // Si ce n'est pas un admin, vérifier que la facture appartient à l'utilisateur
    if (!isAdmin) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    const [factures] = await connection.query(query, params);

    if (factures.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture introuvable'
      });
    }

    const facture = factures[0];

    if (!facture.pdf_path) {
      return res.status(404).json({
        success: false,
        message: 'PDF de la facture introuvable'
      });
    }

    // Chemin absolu vers le fichier PDF
    const filepath = path.resolve(__dirname, '..', 'public', facture.pdf_path.startsWith('/') ? facture.pdf_path.substring(1) : facture.pdf_path);

    console.log(`📥 Tentative téléchargement: ID=${id}, Numero=${facture.numero_facture}`);
    console.log(`📂 Chemin attendu: ${filepath}`);

    // Vérifier que le fichier existe
    if (!fs.existsSync(filepath)) {
      console.error(`❌ Fichier PDF introuvable sur le disque: ${filepath}`);
      return res.status(404).json({
        success: false,
        message: 'Fichier PDF introuvable sur le serveur'
      });
    }

    console.log(`✅ Fichier trouvé, envoi au client...`);

    // Télécharger le fichier
    res.download(filepath, `facture-${facture.numero_facture}.pdf`);

  } catch (error) {
    console.error('Erreur téléchargerFacture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement de la facture'
    });
  } finally {
    connection.release();
  }
};

/**
 * Générer les factures rétroactives pour les utilisateurs déjà abonnés
 */
exports.genererFacturesRetroactives = async (req, res) => {
  const connection = await db.getConnection();

  try {
    // Récupérer tous les utilisateurs avec un forfait (payant ou gratuit)
    const [users] = await connection.query(
      `SELECT u.*, f.nom as forfait_nom, f.prix_mensuel
       FROM users u
       JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.forfait_id IS NOT NULL`
    );

    console.log(`\n🔄 Génération de ${users.length} factures rétroactives...`);

    let facturesCreees = 0;
    let erreurs = 0;

    for (const user of users) {
      try {
        // Vérifier si une facture n'existe pas déjà
        const [existing] = await connection.query(
          `SELECT id FROM factures_forfaits 
           WHERE user_id = ? AND forfait_id = ? AND date_souscription = ?`,
          [user.id, user.forfait_id, user.forfait_date_debut]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Facture déjà existante pour ${user.email}`);
          continue;
        }

        // Créer la facture
        await FactureService.creerFacture(
          connection,
          user.id,
          user.forfait_id,
          user.forfait_date_debut,
          user.forfait_date_expiration
        );

        facturesCreees++;

      } catch (error) {
        console.error(`❌ Erreur pour ${user.email}:`, error.message);
        erreurs++;
      }
    }

    console.log(`\n✅ ${facturesCreees} factures créées`);
    console.log(`❌ ${erreurs} erreurs`);

    res.json({
      success: true,
      message: `${facturesCreees} factures créées`,
      facturesCreees,
      erreurs
    });

  } catch (error) {
    console.error('Erreur genererFacturesRetroactives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des factures'
    });
  } finally {
    connection.release();
  }
};

/**
 * Obtenir les statistiques des factures (Admin)
 */
exports.getStatsFactures = async (req, res) => {
  const connection = await db.getConnection();

  try {
    // Total factures
    const [total] = await connection.query(
      'SELECT COUNT(*) as count, SUM(montant_ttc) as total FROM factures_forfaits'
    );

    // Factures par mois
    const [parMois] = await connection.query(
      `SELECT 
        YEAR(date_creation) as annee,
        MONTH(date_creation) as mois,
        COUNT(*) as count,
        SUM(montant_ttc) as total
       FROM factures_forfaits
       GROUP BY YEAR(date_creation), MONTH(date_creation)
       ORDER BY annee DESC, mois DESC
       LIMIT 12`
    );

    // Factures par forfait
    const [parForfait] = await connection.query(
      `SELECT 
        forfait_nom,
        COUNT(*) as count,
        SUM(montant_ttc) as total
       FROM factures_forfaits
       GROUP BY forfait_nom
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      stats: {
        total: total[0],
        parMois,
        parForfait
      }
    });

  } catch (error) {
    console.error('Erreur getStatsFactures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  } finally {
    connection.release();
  }
};

/**
 * Créer un avoir (Note de crédit)
 */
exports.creerCreditNote = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { note } = req.body;
    
    // Vérifier d'abord si la facture existe et n'est pas déjà annulée
    const [factures] = await connection.query(
      'SELECT statut FROM factures_forfaits WHERE id = ?',
      [id]
    );

    if (factures.length === 0) {
      return res.status(404).json({ success: false, message: 'Facture introuvable' });
    }

    if (factures[0].statut === 'annulee') {
      return res.status(400).json({ success: false, message: 'Facture déjà annulée' });
    }

    const result = await FactureService.creerCreditNote(connection, id, note);

    res.json({
      success: true,
      message: 'Note de crédit créée avec succès',
      data: result
    });

  } catch (error) {
    console.error('Erreur creerCreditNote:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la note de crédit'
    });
  } finally {
    connection.release();
  }
};

/**
 * Télécharger une note de crédit
 */
exports.telechargerCreditNote = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const [factures] = await connection.query('SELECT numero_facture, statut FROM factures_forfaits WHERE id = ?', [id]);

    if (factures.length === 0 || factures[0].statut !== 'annulee') {
      return res.status(404).json({ success: false, message: 'Note de crédit introuvable' });
    }

    const filename = `avoir-NC-${factures[0].numero_facture}.pdf`;
    const filepath = path.resolve(__dirname, '..', 'public', 'factures', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Fichier PDF de la note de crédit introuvable' });
    }

    res.download(filepath, filename);

  } catch (error) {
    console.error('Erreur telechargerCreditNote:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
};

/**
 * Envoyer une note de crédit par email
 */
exports.envoyerCreditNoteMail = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { subject, content } = req.body;

    const [factures] = await connection.query('SELECT f.numero_facture, f.statut, u.email FROM factures_forfaits f JOIN users u ON f.user_id = u.id WHERE f.id = ?', [id]);

    if (factures.length === 0 || factures[0].statut !== 'annulee') {
      return res.status(404).json({ success: false, message: 'Note de crédit introuvable' });
    }

    const filename = `avoir-NC-${factures[0].numero_facture}.pdf`;
    const filepath = path.resolve(__dirname, '..', 'public', 'factures', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Fichier PDF introuvable' });
    }

    const { sendEmail } = require('../config/email');
    await sendEmail({
      to: factures[0].email,
      subject: subject || `Votre note de crédit NC-${factures[0].numero_facture}`,
      html: `<div style="font-family:sans-serif;white-space:pre-wrap;">${content || 'Veuillez trouver ci-joint votre note de crédit.'}</div>`,
      attachments: [{ filename, path: filepath }]
    });

    res.json({ success: true, message: 'Email envoyé avec succès' });

  } catch (error) {
    console.error('Erreur envoyerCreditNoteMail:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
  } finally {
    connection.release();
  }
};

/**
 * Renvoyer une facture à Falco (Admin only)
 */
exports.retryFalco = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    const [factures] = await connection.query(
      'SELECT f.*, u.email, u.nom, u.prenom, u.denomination, u.numero_bce, u.adresse, u.telephone FROM factures_forfaits f JOIN users u ON f.user_id = u.id WHERE f.id = ?',
      [id]
    );

    if (factures.length === 0) {
      return res.status(404).json({ success: false, message: 'Facture introuvable' });
    }

    const facture = factures[0];
    const user = {
      email: facture.email,
      nom: facture.nom,
      prenom: facture.prenom,
      denomination: facture.denomination,
      numero_bce: facture.numero_bce,
      adresse: facture.adresse,
      telephone: facture.telephone
    };

    if (!FalcoService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Configuration Falco incomplète: FALCO_APP_SECRET, FALCO_API_KEY et FALCO_SENDER_VAT_NUMBER sont requis'
      });
    }

    const falcoResult = await FalcoService.sendInvoicePdf({
      facture,
      user,
      pdfPath: facture.pdf_path
    });

    await connection.query(
      `UPDATE factures_forfaits
       SET falco_status = ?, falco_document_id = ?, falco_response = ?, falco_error = NULL, falco_sent_at = NOW()
       WHERE id = ?`,
      [
        falcoResult.status,
        falcoResult.documentId,
        JSON.stringify(falcoResult.response || {}),
        id
      ]
    );

    res.json({
      success: true,
      message: 'Facture transmise avec succès à Falco',
      data: falcoResult
    });

  } catch (error) {
    console.error('Erreur retryFalco:', error);
    await connection.query(
      'UPDATE factures_forfaits SET falco_status = ?, falco_error = ? WHERE id = ?',
      ['error', error.message, req.params.id]
    );
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'envoi à Falco'
    });
  } finally {
    connection.release();
  }
};

