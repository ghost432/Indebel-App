const db = require('../config/db');

async function main() {
  const connection = await db.getConnection();
  try {
    const [factures] = await connection.query('SELECT id, date_creation, montant_ttc FROM factures_forfaits ORDER BY date_creation ASC');
    
    const countByYear = { paid: {}, free: {} };

    for (const f of factures) {
      const year = new Date(f.date_creation).getFullYear();
      const isFree = parseFloat(f.montant_ttc) <= 0;

      if (isFree) {
        if (!countByYear.free[year]) countByYear.free[year] = 1;
        const num = String(countByYear.free[year]).padStart(4, '0');
        const newNumero = `GRATUIT-${year}-${num}`;
        await connection.query('UPDATE factures_forfaits SET numero_facture = ? WHERE id = ?', [newNumero, f.id]);
        console.log(`Updated free ID ${f.id} to ${newNumero}`);
        countByYear.free[year]++;
      } else {
        if (!countByYear.paid[year]) countByYear.paid[year] = 1;
        const num = String(countByYear.paid[year]).padStart(4, '0');
        const newNumero = `IND-${year}-${num}`;
        await connection.query('UPDATE factures_forfaits SET numero_facture = ? WHERE id = ?', [newNumero, f.id]);
        console.log(`Updated paid ID ${f.id} to ${newNumero}`);
        countByYear.paid[year]++;
      }
    }
    console.log('Done updating all invoices.');
  } catch (error) {
    console.error(error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

main();
