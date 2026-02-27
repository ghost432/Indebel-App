const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class FactureService {
  /**
   * Génère un numéro de facture unique
   * Format: INV-YYYY-NNNN
   */
  static async genererNumeroFacture(connection) {
    const annee = new Date().getFullYear();
    const [result] = await connection.query(
      'SELECT COUNT(*) as count FROM factures_forfaits WHERE YEAR(date_creation) = ?',
      [annee]
    );

    const numero = (result[0].count + 1).toString().padStart(4, '0');
    return `PROF-${annee}-${numero}`;
  }

  /**
   * Calcule le montant TTC à partir du HT
   */
  static calculerMontants(montantHT, tvaPourcentage = 21) {
    const ht = parseFloat(montantHT);
    const tva = ht * (tvaPourcentage / 100);
    const ttc = ht + tva;

    return {
      montantHT: parseFloat(ht.toFixed(2)),
      tvaPourcentage: parseFloat(tvaPourcentage),
      montantTVA: parseFloat(tva.toFixed(2)),
      montantTTC: parseFloat(ttc.toFixed(2))
    };
  }

  /**
   * Génère le PDF de la facture
   */
  static async genererPDF(facture, user) {
    return new Promise((resolve, reject) => {
      try {
        // Convertir les montants en numbers
        facture.montant_ht = parseFloat(facture.montant_ht);
        facture.montant_tva = parseFloat(facture.montant_tva);
        facture.montant_ttc = parseFloat(facture.montant_ttc);
        facture.tva_pourcentage = parseFloat(facture.tva_pourcentage);

        // Créer le dossier factures s'il n'existe pas
        const facturesDir = path.join(__dirname, '../public/factures');
        if (!fs.existsSync(facturesDir)) {
          fs.mkdirSync(facturesDir, { recursive: true });
        }

        const filename = `proforma-${facture.numero_facture}.pdf`;
        const filepath = path.join(facturesDir, filename);

        // Créer le document PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // En-tête avec logo
        const logoPath = path.join(__dirname, '../public/logo-facture.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 40, { height: 50 });
        }

        doc.font('Helvetica');
        doc.fontSize(9);
        doc.fillColor('#6b7280');
        doc.text('Plateforme de mise en relation', 50, 95, { align: 'left', width: 250 });
        doc.text('prestataires et recruteurs', 50, 107, { align: 'left', width: 250 });

        // Titre PROFORMA
        doc.fontSize(28);
        doc.fillColor('#1f2937');
        doc.text('PROFORMA', 350, 50, { align: 'right', width: 195 });

        // Numéro de facture
        const dateFacture = new Date(facture.date_creation);
        doc.fontSize(11);
        doc.fillColor('#1f2937');
        doc.text(facture.numero_facture, 350, 90, { align: 'right', width: 195 });

        // Date
        doc.fontSize(10);
        doc.fillColor('#6b7280');
        doc.text(`Date: ${this.formaterDate(dateFacture)}`, 350, 110, { align: 'right', width: 195 });

        // Ligne de séparation
        doc.strokeColor('#e5e7eb');
        doc.lineWidth(1);
        doc.moveTo(50, 125);
        doc.lineTo(545, 125);
        doc.stroke();

        // Informations du client
        doc.fontSize(11);
        doc.fillColor('#1f2937');
        doc.text('FACTURÉ À:', 50, 145, { width: 200 });

        doc.fontSize(10);
        doc.fillColor('#374151');
        doc.text(`${user.prenom || ''} ${user.nom}`, 50, 165, { width: 200 });
        doc.text(user.email, 50, 180, { width: 200 });

        if (user.numero_bce) {
          doc.text(`N° BCE: ${user.numero_bce}`, 50, 195);
        }
        if (user.adresse) {
          doc.text(user.adresse, 50, user.numero_bce ? 210 : 195);
        }

        // Tableau des détails
        const tableTop = 250;

        // En-tête du tableau
        doc.rect(50, tableTop, 495, 25);
        doc.fill('#2563eb');

        doc.fontSize(10);
        doc.fillColor('#ffffff');
        doc.text('DESCRIPTION', 60, tableTop + 8, { width: 200 });
        doc.text('PÉRIODE', 270, tableTop + 8, { width: 100 });
        doc.text('MONTANT HT', 380, tableTop + 8, { width: 165, align: 'right' });

        // Ligne du forfait
        const itemY = tableTop + 35;

        doc.fontSize(10);
        doc.fillColor('#1f2937');
        doc.text(facture.forfait_nom, 60, itemY, { width: 200 });

        // Période
        const dateDebut = new Date(facture.date_souscription);
        let periode = this.formaterDate(dateDebut);
        if (facture.date_expiration) {
          const dateFin = new Date(facture.date_expiration);
          periode += ` - ${this.formaterDate(dateFin)}`;
        } else {
          periode += ' - Illimité';
        }

        doc.fontSize(9);
        doc.fillColor('#6b7280');
        doc.text(periode, 270, itemY, { width: 100 });

        doc.fontSize(10);
        doc.fillColor('#1f2937');
        doc.text(`${facture.montant_ht.toFixed(2)} €`, 380, itemY, { width: 165, align: 'right' });

        // Ligne de séparation
        doc.strokeColor('#e5e7eb');
        doc.lineWidth(0.5);
        doc.moveTo(50, itemY + 25);
        doc.lineTo(545, itemY + 25);
        doc.stroke();

        // Totaux
        const totauxY = itemY + 45;

        // Sous-total
        doc.fontSize(10);
        doc.fillColor('#6b7280');
        doc.text('Sous-total HT:', 350, totauxY, { align: 'right', width: 100 });
        doc.fillColor('#1f2937');
        doc.text(`${facture.montant_ht.toFixed(2)} €`, 460, totauxY, { align: 'right', width: 85 });

        // TVA
        doc.fillColor('#6b7280');
        doc.text(`TVA (${facture.tva_pourcentage}%):`, 350, totauxY + 20, { align: 'right', width: 100 });
        doc.fillColor('#1f2937');
        doc.text(`${facture.montant_tva.toFixed(2)} €`, 460, totauxY + 20, { align: 'right', width: 85 });

        // Total TTC
        doc.rect(350, totauxY + 45, 195, 30);
        doc.fill('#2563eb');

        doc.fontSize(12);
        doc.fillColor('#ffffff');
        doc.text('TOTAL TTC:', 360, totauxY + 55, { width: 90 });
        doc.fontSize(14);
        doc.text(`${facture.montant_ttc.toFixed(2)} €`, 460, totauxY + 53, { align: 'right', width: 85 });

        // Notes
        doc.fontSize(9);
        doc.fillColor('#6b7280');
        doc.text('Paiement effectué par carte bancaire.', 50, totauxY + 100, { width: 495 });
        doc.text('Merci pour votre confiance !', 50, totauxY + 115, { width: 495 });

        // Pied de page
        doc.fontSize(8);
        doc.fillColor('#9ca3af');
        doc.text('contact@indebel.be - www.indebel.be', 50, 750, { align: 'center', width: 495 });

        // Finaliser le PDF
        doc.end();

        stream.on('finish', () => {
          resolve(`/factures/${filename}`);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Formate une date au format DD/MM/YYYY
   */
  static formaterDate(date) {
    const d = new Date(date);
    const jour = String(d.getDate()).padStart(2, '0');
    const mois = String(d.getMonth() + 1).padStart(2, '0');
    const annee = d.getFullYear();
    return `${jour}/${mois}/${annee}`;
  }

  /**
   * Crée une facture pour une souscription de forfait
   */
  static async creerFacture(connection, userId, forfaitId, datesouscription, dateExpiration) {
    try {
      // Récupérer les infos du forfait
      const [forfaits] = await connection.query(
        'SELECT * FROM forfaits WHERE id = ?',
        [forfaitId]
      );

      if (forfaits.length === 0) {
        throw new Error('Forfait introuvable');
      }

      const forfait = forfaits[0];

      // Ne pas bloquer la création pour les forfaits gratuits, on veut un historique
      const isFree = forfait.prix_mensuel === 0 || forfait.prix_mensuel === null;
      const statut = isFree ? 'gratuit' : 'payee';

      // Récupérer les infos de l'utilisateur
      const [users] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        throw new Error('Utilisateur introuvable');
      }

      const user = users[0];

      // Générer le numéro de facture
      const numeroFacture = await this.genererNumeroFacture(connection);

      // Calculer les montants
      const montants = this.calculerMontants(forfait.prix_mensuel);

      // Calculer la durée en mois
      let dureeMois = null;
      if (dateExpiration) {
        const debut = new Date(datesouscription);
        const fin = new Date(dateExpiration);
        dureeMois = Math.round((fin - debut) / (1000 * 60 * 60 * 24 * 30));
      }

      // Créer la facture dans la BD
      const [result] = await connection.query(
        `INSERT INTO factures_forfaits 
        (numero_facture, user_id, forfait_id, forfait_nom, montant_ht, tva_pourcentage, 
         montant_tva, montant_ttc, date_souscription, date_expiration, duree_mois, statut) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numeroFacture,
          userId,
          forfaitId,
          forfait.nom,
          montants.montantHT,
          montants.tvaPourcentage,
          montants.montantTVA,
          montants.montantTTC,
          datesouscription,
          dateExpiration,
          dureeMois,
          statut
        ]
      );

      const factureId = result.insertId;

      // Récupérer la facture créée
      const [factures] = await connection.query(
        'SELECT * FROM factures_forfaits WHERE id = ?',
        [factureId]
      );

      const facture = factures[0];

      // Générer le PDF
      const pdfPath = await this.genererPDF(facture, user);

      // Mettre à jour le chemin du PDF
      await connection.query(
        'UPDATE factures_forfaits SET pdf_path = ? WHERE id = ?',
        [pdfPath, factureId]
      );

      console.log(`✅ Facture ${numeroFacture} créée pour l'utilisateur ${user.email}`);

      return {
        ...facture,
        pdf_path: pdfPath
      };

    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      throw error;
    }
  }
}

module.exports = FactureService;
