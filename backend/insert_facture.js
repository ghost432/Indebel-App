const db = require('./config/db');

async function main() {
  try {
    const query = `
      INSERT INTO factures_forfaits (
        numero_facture, user_id, forfait_id, forfait_nom, montant_ht, 
        tva_pourcentage, montant_tva, montant_ttc, date_souscription, 
        date_expiration, duree_mois, statut, pdf_path
      ) VALUES (
        'FACT-2026-07-001', 45, 1, 'Gratuit', 0.00,
        21.00, 0.00, 0.00, NOW(), 
        DATE_ADD(NOW(), INTERVAL 1 MONTH), 1, 'payee', NULL
      ), (
        'FACT-2026-06-052', 45, 2, 'Premium', 29.99,
        21.00, 6.30, 36.29, DATE_SUB(NOW(), INTERVAL 1 MONTH), 
        NOW(), 1, 'payee', NULL
      )
    `;
    await db.query(query);
    console.log("Mock invoices inserted for Sarah (id: 45)!");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
