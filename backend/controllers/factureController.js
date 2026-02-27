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
 * Récupérer toutes les factures (Admin)
 */
exports.getAllFactures = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const [factures] = await connection.query(
      `SELECT f.*, 
              u.nom as user_nom, 
              u.prenom as user_prenom, 
              u.email as user_email,
              fo.nom as forfait_nom_actuel
       FROM factures_forfaits f
       JOIN users u ON f.user_id = u.id
       LEFT JOIN forfaits fo ON f.forfait_id = fo.id
       ORDER BY f.date_creation DESC`
    );

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
