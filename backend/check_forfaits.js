const db = require('./config/db');

async function main() {
  try {
    const [forfaits] = await db.query("SELECT id, nom, type_utilisateur FROM forfaits");
    console.log("All Forfaits mapped:", forfaits);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
