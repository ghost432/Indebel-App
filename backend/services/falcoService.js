const fs = require('fs');
const path = require('path');
const axios = require('axios');

const toAmount = (value) => Number.parseFloat(value || 0).toFixed(2);

const cleanVat = (value) => {
  if (!value) return undefined;
  const cleaned = String(value).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!cleaned) return undefined;
  return cleaned.startsWith('BE') ? cleaned : `BE${cleaned}`;
};

const compact = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

class FalcoService {
  static isConfigured() {
    return Boolean(
      process.env.FALCO_APP_SECRET &&
      process.env.FALCO_API_KEY &&
      process.env.FALCO_SENDER_VAT_NUMBER
    );
  }

  static getBaseUrl() {
    return (process.env.FALCO_BASE_URL || 'https://api.falco-app.be').replace(/\/$/, '');
  }

  static getSender() {
    return {
      name: process.env.FALCO_SENDER_NAME || 'Indebel',
      vat_number: cleanVat(process.env.FALCO_SENDER_VAT_NUMBER),
      contact: compact({
        name: process.env.FALCO_SENDER_CONTACT_NAME || 'Indebel',
        email: process.env.FALCO_SENDER_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER,
        phone: process.env.FALCO_SENDER_PHONE
      }),
      address: compact({
        line1: process.env.FALCO_SENDER_ADDRESS_LINE1 || 'Adresse Indebel',
        zip: process.env.FALCO_SENDER_ZIP || '1000',
        city: process.env.FALCO_SENDER_CITY || 'Bruxelles',
        region: process.env.FALCO_SENDER_REGION,
        country: process.env.FALCO_SENDER_COUNTRY || 'BE'
      })
    };
  }

  static getReceiver(user) {
    const vatNumber = cleanVat(user.numero_tva || user.numero_bce);
    const name = user.denomination || [user.prenom, user.nom].filter(Boolean).join(' ') || user.email;

    return compact({
      name,
      vat_number: vatNumber,
      contact: compact({
        name,
        email: user.email,
        phone: user.telephone
      }),
      address: compact({
        line1: user.adresse || 'Adresse non renseignée',
        zip: user.code_postal || process.env.FALCO_DEFAULT_RECEIVER_ZIP || '1000',
        city: user.ville || process.env.FALCO_DEFAULT_RECEIVER_CITY || 'Bruxelles',
        region: user.region,
        country: user.pays || process.env.FALCO_DEFAULT_RECEIVER_COUNTRY || 'BE'
      })
    });
  }

  static buildMetadata(facture, user) {
    const documentDate = new Date(facture.date_creation || Date.now()).toISOString().slice(0, 10);
    const baseAmount = toAmount(facture.montant_ht);
    const taxAmount = toAmount(facture.montant_tva);
    const totalAmount = toAmount(facture.montant_ttc);
    const taxRate = Number.parseFloat(facture.tva_pourcentage || 21).toFixed(1);
    const taxRegimeType = Number.parseFloat(taxRate) > 0 ? 'standard' : 'taxes_not_applicable';

    return {
      document_type: 'sale_invoice',
      document_date: documentDate,
      due_date: documentDate,
      number: facture.numero_facture,
      note: `Facture forfait Indebel ${facture.forfait_nom}`,
      buyer_reference: user.email || 'N/A',
      sender: this.getSender(),
      receiver: this.getReceiver(user),
      currency: 'EUR',
      base_amount: baseAmount,
      total_amount: totalAmount,
      tax_subtotals: [
        {
          tax_rate: taxRate,
          base_amount: baseAmount,
          tax_amount: taxAmount,
          tax_regime: { type: taxRegimeType }
        }
      ],
      lines: [
        {
          name: facture.forfait_nom,
          description: `Abonnement Indebel - ${facture.forfait_nom}`,
          quantity: '1',
          unit_price: baseAmount,
          tax_rate: taxRate,
          base_amount: baseAmount,
          tax_regime_type: taxRegimeType,
          unit_of_measure: 'EA'
        }
      ],
      send_peppol: process.env.FALCO_SEND_PEPPOL === 'true',
      send_accounting: process.env.FALCO_SEND_ACCOUNTING === 'true'
    };
  }

  static async sendInvoicePdf({ facture, user, pdfPath }) {
    if (!this.isConfigured()) {
      throw new Error('Configuration Falco incomplète: FALCO_APP_SECRET, FALCO_API_KEY et FALCO_SENDER_VAT_NUMBER sont requis');
    }

    const absolutePdfPath = path.resolve(
      __dirname,
      '..',
      'public',
      pdfPath.startsWith('/') ? pdfPath.slice(1) : pdfPath
    );

    if (!fs.existsSync(absolutePdfPath)) {
      throw new Error(`PDF facture introuvable: ${absolutePdfPath}`);
    }

    const metadata = this.buildMetadata(facture, user);
    const pdfBuffer = fs.readFileSync(absolutePdfPath);
    const form = new FormData();
    form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `facture-${facture.numero_facture}.pdf`);
    form.append('metadata', JSON.stringify(metadata));

    const response = await axios.post(
      `${this.getBaseUrl()}/v1/invoices/imports/pdf`,
      form,
      {
        headers: {
          accept: 'application/json',
          'X-Falco-App-Secret': process.env.FALCO_APP_SECRET,
          'X-Falco-Api-Key': process.env.FALCO_API_KEY
        },
        maxBodyLength: Infinity,
        timeout: Number.parseInt(process.env.FALCO_TIMEOUT_MS || '20000', 10)
      }
    );

    return {
      status: 'sent',
      documentId: response.data?.id || response.data?.invoice_id || response.data?.document_id || null,
      response: response.data
    };
  }

  static async sendCreditNotePdf({ facture, user, pdfPath, note }) {
    if (!this.isConfigured()) {
      throw new Error('Configuration Falco incomplète');
    }

    const absolutePdfPath = path.resolve(
      __dirname,
      '..',
      'public',
      pdfPath.startsWith('/') ? pdfPath.slice(1) : pdfPath
    );

    if (!fs.existsSync(absolutePdfPath)) {
      throw new Error(`PDF facture introuvable: ${absolutePdfPath}`);
    }

    const cnNum = `NC-${facture.numero_facture}`;
    const invRef = facture.numero_facture;
    const documentDate = new Date().toISOString().slice(0, 10);
    const baseAmount = toAmount(facture.montant_ht);
    const taxAmount = toAmount(facture.montant_tva);
    const totalAmount = toAmount(facture.montant_ttc);
    const taxRate = Number.parseFloat(facture.tva_pourcentage || 21).toFixed(1);
    const taxRegimeType = Number.parseFloat(taxRate) > 0 ? 'standard' : 'taxes_not_applicable';

    const metadata = {
      document_type: "sale_credit_note",
      document_date: documentDate,
      number: cnNum,
      note: note || `Note de crédit — Réf. facture ${invRef} — Annulation d'abonnement`,
      buyer_reference: user.email || 'N/A',
      sender: this.getSender(),
      receiver: this.getReceiver(user),
      currency: "EUR",
      base_amount: baseAmount,
      total_amount: totalAmount,
      tax_subtotals: [
        {
          tax_rate: taxRate,
          base_amount: baseAmount,
          tax_amount: taxAmount,
          tax_regime: { type: taxRegimeType },
        },
      ],
      lines: [
        {
          name: facture.forfait_nom,
          description: `Note de crédit — ${facture.forfait_nom} — Réf. ${invRef}`,
          quantity: "1",
          unit_price: baseAmount,
          tax_rate: taxRate,
          base_amount: baseAmount,
          tax_regime_type: taxRegimeType,
          unit_of_measure: "EA",
        },
      ],
      send_peppol: process.env.FALCO_SEND_PEPPOL === "true",
      send_accounting: process.env.FALCO_SEND_ACCOUNTING === "true",
    };

    const pdfBuffer = fs.readFileSync(absolutePdfPath);
    const form = new FormData();
    form.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), `${cnNum}.pdf`);
    form.append("metadata", JSON.stringify(metadata));

    const response = await axios.post(
      `${this.getBaseUrl()}/v1/invoices/imports/pdf`,
      form,
      {
        headers: {
          accept: 'application/json',
          'X-Falco-App-Secret': process.env.FALCO_APP_SECRET,
          'X-Falco-Api-Key': process.env.FALCO_API_KEY
        },
        maxBodyLength: Infinity,
        timeout: Number.parseInt(process.env.FALCO_TIMEOUT_MS || '20000', 10)
      }
    );

    return {
      status: "sent",
      documentId: response.data?.id || response.data?.invoice_id || response.data?.document_id || null,
      response: response.data,
    };
  }
}

module.exports = FalcoService;
