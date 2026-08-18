const path = require('path');
const FactureService = require('../services/factureService');

async function main() {
  const now = new Date();
  const expiration = new Date(now);
  expiration.setMonth(expiration.getMonth() + 1);

  const facture = {
    numero_facture: 'FACT-2026-0001-PREVIEW-DESIGN',
    date_creation: now,
    date_souscription: now,
    date_expiration: expiration,
    forfait_nom: 'Forfait Premium Indebel',
    montant_ht: 49,
    montant_tva: 10.29,
    montant_ttc: 59.29,
    tva_pourcentage: 21,
  };

  const user = {
    prenom: 'Thierry',
    nom: 'Client Test',
    email: 'client.test@indebel.be',
    numero_bce: 'BE 0123.456.789',
    adresse: 'Rue Exemple 12, 1000 Bruxelles',
  };

  const pdfPath = await FactureService.genererPDF(facture, user);
  const absolutePath = path.join(__dirname, '../public', pdfPath.replace(/^\//, ''));

  console.log(JSON.stringify({ pdfPath, absolutePath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
