const db = require('./config/db');
const FactureService = require('./services/factureService');

async function main() {
  const connection = await db.getConnection();
  try {
    // Delete the mock invoices first to allow retroactive creation
    await connection.query("DELETE FROM factures_forfaits WHERE user_id = 45");
    console.log("Deleted old mock invoices");
    
    // Now trigger retroactive creation for user 45
    const [users] = await connection.query(
      `SELECT u.*, f.nom as forfait_nom, f.prix_mensuel
       FROM users u
       JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = 45`
    );

    for (const user of users) {
      console.log(`Generating for ${user.email}`);
      await FactureService.creerFacture(
        connection,
        user.id,
        user.forfait_id,
        user.forfait_date_debut || new Date(),
        user.forfait_date_expiration || new Date(Date.now() + 30*24*60*60*1000)
      );
    }
    console.log("Retroactive generation done.");
  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}
main();
