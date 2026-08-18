const db = require('./config/db');
const FactureService = require('./services/factureService');

async function main() {
  const connection = await db.getConnection();
  try {
    console.log("Generating Premium invoice for testing Falco");
    await FactureService.creerFacture(
      connection,
      45, // user_id
      2,  // forfait_id Premium
      new Date(),
      new Date(Date.now() + 30*24*60*60*1000)
    );
    console.log("Premium Invoice generation done.");
  } catch (err) {
    console.error("Falco Error: ", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}
main();
