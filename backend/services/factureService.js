const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const FalcoService = require('./falcoService');
const { sendEmail, getAdminEmails } = require('../config/email');

class FactureService {
  /**
   * Génère un numéro de facture unique
   * Format pour payant: IND-YYYY-NNNN
   * Format pour gratuit: GRATUIT-YYYY-NNNN
   */
  static async genererNumeroFacture(connection, isFree = false) {
    const annee = new Date().getFullYear();
    const prefixe = isFree ? `GRATUIT-${annee}-` : `IND-${annee}-`;
    const [result] = await connection.query(
      'SELECT COUNT(*) as count FROM factures_forfaits WHERE numero_facture LIKE ?',
      [`${prefixe}%`]
    );

    const numero = (result[0].count + 1).toString().padStart(4, '0');
    return `${prefixe}${numero}`;
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

        const filename = `facture-${facture.numero_facture}.pdf`;
        const filepath = path.join(facturesDir, filename);

        // Créer le document PDF
        const doc = new PDFDocument({ margin: 46, size: 'A4' });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        const primaryColor = '#3155f3';
        const accentColor = '#e85f1a';
        const darkColor = '#414552';
        const mutedColor = '#6b7280';
        const softBlue = '#eef3ff';
        const softOrange = '#fff3ec';
        const borderColor = '#e5e7eb';
        const pageWidth = doc.page.width;

        // En-tête avec univers Indebel
        doc.rect(0, 0, pageWidth, 124).fill(softBlue);
        doc.circle(496, 36, 92).fill('#dfe8ff');
        doc.circle(56, 112, 82).fill(softOrange);
        doc.roundedRect(46, 38, 132, 64, 16).fill('#ffffff');

        const logoPath = path.join(__dirname, '../public/logo-facture.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 58, 52, { width: 108 });
        }

        doc.font('Helvetica-Bold');
        doc.fontSize(29);
        doc.fillColor(darkColor);
        doc.text('FACTURE', 350, 42, { align: 'right', width: 195 });

        const dateFacture = new Date(facture.date_creation);
        doc.font('Helvetica');
        doc.fontSize(10);
        doc.fillColor(mutedColor);
        doc.text(`#${facture.numero_facture}`, 350, 80, { align: 'right', width: 195 });
        doc.text(`Date : ${this.formaterDate(dateFacture)}`, 350, 98, { align: 'right', width: 195 });

        doc.font('Helvetica-Bold');
        doc.fontSize(9);
        doc.fillColor(primaryColor);
        doc.text('L’INDÉPENDANCE CONNECTÉE', 58, 103, { width: 210 });

        // Blocs client et emetteur
        const infoTop = 158;
        doc.roundedRect(46, infoTop, 238, 124, 16).fill('#ffffff').stroke(borderColor);
        doc.roundedRect(312, infoTop, 238, 124, 16).fill('#ffffff').stroke(borderColor);

        doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
        doc.text('FACTURÉ À', 66, infoTop + 18, { width: 198 });
        doc.fontSize(12).fillColor(darkColor);
        doc.text(`${user.prenom || ''} ${user.nom}`.trim() || user.email, 66, infoTop + 42, { width: 198 });
        doc.font('Helvetica').fontSize(9.5).fillColor(mutedColor);
        doc.text(user.email, 66, infoTop + 62, { width: 198 });
        let clientY = infoTop + 80;
        if (user.numero_bce) {
          doc.text(`N° BCE : ${user.numero_bce}`, 66, clientY, { width: 198 });
          clientY += 15;
        }
        if (user.adresse) {
          doc.text(user.adresse, 66, clientY, { width: 198 });
        }

        doc.font('Helvetica-Bold').fontSize(11).fillColor(accentColor);
        doc.text('ÉMETTEUR', 332, infoTop + 18, { width: 198 });
        doc.fontSize(12).fillColor(darkColor);
        doc.text('Dreambis SRL', 332, infoTop + 42, { width: 198 });
        doc.font('Helvetica').fontSize(9.5).fillColor(mutedColor);
        doc.text('Rue d’Havré 9', 332, infoTop + 62, { width: 198 });
        doc.text('7000 Mons, Belgique', 332, infoTop + 77, { width: 198 });
        doc.text('Numéro d’entreprise : BE 0798.656.725', 332, infoTop + 92, { width: 198 });

        // Tableau des détails
        const tableTop = 330;

        doc.roundedRect(46, tableTop, 504, 38, 13).fill(primaryColor);
        doc.font('Helvetica-Bold').fontSize(9.5);
        doc.fillColor('#ffffff');
        doc.text('DESCRIPTION', 66, tableTop + 14, { width: 200 });
        doc.text('PÉRIODE', 286, tableTop + 14, { width: 120 });
        doc.text('MONTANT HT', 426, tableTop + 14, { width: 104, align: 'right' });

        const itemY = tableTop + 56;
        const dateDebut = new Date(facture.date_souscription);
        let periode = this.formaterDate(dateDebut);
        if (facture.date_expiration) {
          const dateFin = new Date(facture.date_expiration);
          periode += ` - ${this.formaterDate(dateFin)}`;
        } else {
          periode += ' - Illimité';
        }

        doc.roundedRect(46, itemY - 16, 504, 62, 14).fill('#f8fafc');
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(darkColor);
        doc.text(facture.forfait_nom, 66, itemY, { width: 190 });
        doc.font('Helvetica').fontSize(8.8).fillColor(mutedColor);
        doc.text('Abonnement Indebel', 66, itemY + 16, { width: 190 });
        doc.fontSize(9.2).fillColor(darkColor);
        doc.text(periode, 286, itemY, { width: 120 });
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(darkColor);
        doc.text(`${facture.montant_ht.toFixed(2)} €`, 426, itemY, { width: 104, align: 'right' });

        // Totaux
        const totauxY = itemY + 88;
        doc.roundedRect(322, totauxY - 18, 228, 124, 16).fill('#ffffff').stroke(borderColor);

        doc.font('Helvetica').fontSize(10).fillColor(mutedColor);
        doc.text('Sous-total HT', 344, totauxY, { width: 110 });
        doc.fillColor(darkColor);
        doc.text(`${facture.montant_ht.toFixed(2)} €`, 452, totauxY, { align: 'right', width: 78 });

        doc.fillColor(mutedColor);
        doc.text(`TVA (${facture.tva_pourcentage}%)`, 344, totauxY + 24, { width: 110 });
        doc.fillColor(darkColor);
        doc.text(`${facture.montant_tva.toFixed(2)} €`, 452, totauxY + 24, { align: 'right', width: 78 });

        doc.roundedRect(342, totauxY + 54, 188, 38, 12).fill(accentColor);
        doc.font('Helvetica-Bold').fontSize(12);
        doc.fillColor('#ffffff');
        doc.text('TOTAL TTC', 358, totauxY + 68, { width: 86 });
        doc.fontSize(14);
        doc.text(`${facture.montant_ttc.toFixed(2)} €`, 444, totauxY + 66, { align: 'right', width: 72 });

        // Notes
        doc.roundedRect(46, totauxY + 138, 250, 62, 14).fill(softOrange);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(accentColor);
        doc.text('Paiement confirmé', 66, totauxY + 156, { width: 210 });
        doc.font('Helvetica').fontSize(9).fillColor(darkColor);
        doc.text('Paiement effectué par carte bancaire. Merci pour votre confiance.', 66, totauxY + 174, { width: 210 });

        // Pied de page
        doc.font('Helvetica').fontSize(8);
        doc.fillColor('#9ca3af');
        doc.text('contact@indebel.be - www.indebel.be', 46, 762, { align: 'center', width: 504 });

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

      // Générer le numéro de facture (selon si payant ou gratuit)
      const numeroFacture = await this.genererNumeroFacture(connection, isFree);

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

      let falcoResult = null;
      if (parseFloat(facture.montant_ttc) <= 0) {
        await connection.query(
          'UPDATE factures_forfaits SET falco_status = ? WHERE id = ?',
          ['skipped_free', factureId]
        );
        console.log(`ℹ️ Facture ${numeroFacture} gratuite, envoi Falco ignoré`);
        console.log(`✅ Facture ${numeroFacture} créée pour l'utilisateur ${user.email}`);

        return {
          ...facture,
          pdf_path: pdfPath,
          falco: { status: 'skipped_free' }
        };
      }

      try {
        falcoResult = await FalcoService.sendInvoicePdf({
          facture: { ...facture, pdf_path: pdfPath },
          user,
          pdfPath
        });

        await connection.query(
          `UPDATE factures_forfaits
           SET falco_status = ?, falco_document_id = ?, falco_response = ?, falco_error = NULL, falco_sent_at = NOW()
           WHERE id = ?`,
          [
            falcoResult.status,
            falcoResult.documentId,
            JSON.stringify(falcoResult.response || {}),
            factureId
          ]
        );
        console.log(`✅ Facture ${numeroFacture} envoyée à Falco`);

        try {
          await sendEmail({
            to: getAdminEmails(),
            subject: `✅ Facture envoyée à Falco - ${numeroFacture}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px">
                <div style="background:#0f172a;color:#fff;padding:22px;border-radius:10px;margin-bottom:18px">
                  <h2 style="margin:0;font-size:22px">Facture envoyée à Falco</h2>
                  <p style="margin:8px 0 0;color:#cbd5e1">La facture a bien été transmise après paiement.</p>
                </div>
                <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden">
                  <tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><strong>Facture</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${numeroFacture}</td></tr>
                  <tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><strong>Client</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${user.prenom || ''} ${user.nom || ''} (${user.email})</td></tr>
                  <tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><strong>Forfait</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${facture.forfait_nom}</td></tr>
                  <tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><strong>Montant TTC</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${parseFloat(facture.montant_ttc).toFixed(2)} €</td></tr>
                  <tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><strong>Statut Falco</strong></td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${falcoResult.status}</td></tr>
                  <tr><td style="padding:10px 12px"><strong>Document Falco</strong></td><td style="padding:10px 12px">${falcoResult.documentId || 'Non communiqué'}</td></tr>
                </table>
                <p style="margin-top:18px">
                  <a href="${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/admin/factures" style="background:#2563eb;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:700">Voir les factures</a>
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error(`Erreur email admin Falco facture ${numeroFacture}:`, emailError.message);
        }
      } catch (falcoError) {
        const responseData = falcoError.response?.data || null;
        const status = falcoError.response?.status ? `error_${falcoError.response.status}` : 'error';
        const message = responseData ? JSON.stringify(responseData) : falcoError.message;

        await connection.query(
          `UPDATE factures_forfaits
           SET falco_status = ?, falco_response = ?, falco_error = ?
           WHERE id = ?`,
          [
            status,
            responseData ? JSON.stringify(responseData) : null,
            message,
            factureId
          ]
        );
        console.error(`❌ Erreur Falco facture ${numeroFacture}:`, message);
      }

      console.log(`✅ Facture ${numeroFacture} créée pour l'utilisateur ${user.email}`);

      return {
        ...facture,
        pdf_path: pdfPath,
        falco: falcoResult
      };

    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      throw error;
    }
  }
  /**
   * Génère le PDF de la note de crédit
   */
  static async genererPDFCreditNote(facture, user) {
    return new Promise((resolve, reject) => {
      try {
        const facturesDir = path.join(__dirname, '../public/factures');
        if (!fs.existsSync(facturesDir)) {
          fs.mkdirSync(facturesDir, { recursive: true });
        }

        const filename = `avoir-NC-${facture.numero_facture}.pdf`;
        const filepath = path.join(facturesDir, filename);

        const doc = new PDFDocument({ margin: 46, size: 'A4' });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        const primaryColor = '#c02525';
        const darkColor = '#414552';
        const mutedColor = '#6b7280';
        const borderColor = '#e5e7eb';
        const pageWidth = doc.page.width;

        // En-tête
        doc.rect(0, 0, pageWidth, 124).fill('#fef2f2');
        
        const logoPath = path.join(__dirname, '../public/logo-facture.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 58, 52, { width: 108 });
        }

        doc.font('Helvetica-Bold').fontSize(26).fillColor(primaryColor);
        doc.text('NOTE DE CRÉDIT', 250, 42, { align: 'right', width: 295 });

        doc.font('Helvetica').fontSize(10).fillColor(mutedColor);
        doc.text(`NC-${facture.numero_facture}`, 350, 80, { align: 'right', width: 195 });
        doc.text(`Date : ${this.formaterDate(new Date())}`, 350, 98, { align: 'right', width: 195 });
        doc.text(`Réf. Facture : ${facture.numero_facture}`, 350, 110, { align: 'right', width: 195 });

        // Blocs client et emetteur (simplified)
        const infoTop = 158;
        doc.roundedRect(46, infoTop, 238, 124, 16).fill('#ffffff').stroke(borderColor);
        doc.roundedRect(312, infoTop, 238, 124, 16).fill('#ffffff').stroke(borderColor);

        doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
        doc.text('CLIENT', 66, infoTop + 18, { width: 198 });
        doc.fontSize(12).fillColor(darkColor);
        doc.text(`${user.prenom || ''} ${user.nom}`.trim() || user.email, 66, infoTop + 42, { width: 198 });
        doc.font('Helvetica').fontSize(9.5).fillColor(mutedColor);
        doc.text(user.email, 66, infoTop + 62, { width: 198 });

        doc.font('Helvetica-Bold').fontSize(11).fillColor(darkColor);
        doc.text('ÉMETTEUR', 332, infoTop + 18, { width: 198 });
        doc.fontSize(12).fillColor(darkColor);
        doc.text('Dreambis SRL', 332, infoTop + 42, { width: 198 });
        doc.font('Helvetica').fontSize(9.5).fillColor(mutedColor);
        doc.text('Rue d’Havré 9', 332, infoTop + 62, { width: 198 });
        doc.text('7000 Mons, Belgique', 332, infoTop + 77, { width: 198 });
        doc.text('BE 0798.656.725', 332, infoTop + 92, { width: 198 });

        // Tableau
        const tableTop = 330;
        doc.roundedRect(46, tableTop, 504, 38, 13).fill(primaryColor);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
        doc.text('DESCRIPTION', 66, tableTop + 14, { width: 200 });
        doc.text('MONTANT HT', 426, tableTop + 14, { width: 104, align: 'right' });

        const itemY = tableTop + 56;
        doc.roundedRect(46, itemY - 16, 504, 62, 14).fill('#f8fafc');
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(darkColor);
        doc.text(`Annulation abonnement - ${facture.forfait_nom}`, 66, itemY, { width: 300 });
        doc.text(`-${Number(facture.montant_ht).toFixed(2)} €`, 426, itemY, { width: 104, align: 'right' });

        // Totaux
        const totauxY = itemY + 88;
        doc.roundedRect(322, totauxY - 18, 228, 124, 16).fill('#ffffff').stroke(borderColor);

        doc.font('Helvetica').fontSize(10).fillColor(mutedColor);
        doc.text('Sous-total HT', 344, totauxY, { width: 110 });
        doc.fillColor(darkColor).text(`-${Number(facture.montant_ht).toFixed(2)} €`, 452, totauxY, { align: 'right', width: 78 });

        doc.fillColor(mutedColor).text(`TVA (${facture.tva_pourcentage}%)`, 344, totauxY + 24, { width: 110 });
        doc.fillColor(darkColor).text(`-${Number(facture.montant_tva).toFixed(2)} €`, 452, totauxY + 24, { align: 'right', width: 78 });

        doc.roundedRect(342, totauxY + 54, 188, 38, 12).fill(primaryColor);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff');
        doc.text('TOTAL TTC', 358, totauxY + 68, { width: 86 });
        doc.fontSize(14).text(`-${Number(facture.montant_ttc).toFixed(2)} €`, 444, totauxY + 66, { align: 'right', width: 72 });

        doc.end();

        stream.on('finish', () => resolve(`/factures/${filename}`));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Crée un avoir (Note de crédit) pour une facture existante
   */
  static async creerCreditNote(connection, factureId, note) {
    try {
      const [factures] = await connection.query(
        'SELECT * FROM factures_forfaits WHERE id = ?',
        [factureId]
      );

      if (factures.length === 0) throw new Error('Facture introuvable');
      const facture = factures[0];

      if (facture.statut === 'annulee') throw new Error('Facture déjà annulée');

      const [users] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [facture.user_id]
      );
      const user = users[0];

      // Mettre le statut à annulée
      await connection.query(
        'UPDATE factures_forfaits SET statut = ? WHERE id = ?',
        ['annulee', factureId]
      );

      const pdfPath = await this.genererPDFCreditNote(facture, user);

      let falcoResult = null;
      if (parseFloat(facture.montant_ttc) > 0) {
        try {
          falcoResult = await FalcoService.sendCreditNotePdf({
            facture,
            user,
            pdfPath,
            note
          });
          
          await connection.query(
            `UPDATE factures_forfaits
             SET falco_status = ?, falco_document_id = ?, falco_response = ?, falco_error = NULL
             WHERE id = ?`,
            [
              falcoResult.status,
              falcoResult.documentId,
              JSON.stringify(falcoResult.response || {}),
              factureId
            ]
          );
        } catch (error) {
          console.error(`Erreur création Avoir Falco pour la facture ${facture.numero_facture}:`, error.message);
        }
      }

      return {
        ...facture,
        statut: 'annulee',
        avoir_pdf_path: pdfPath,
        falco: falcoResult
      };

    } catch (error) {
      console.error('Erreur lors de la création de la note de crédit:', error);
      throw error;
    }
  }
}

module.exports = FactureService;
