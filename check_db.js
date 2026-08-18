const db = require('./backend/config/db');
async function run() {
  try {
    await db.query("ALTER TABLE forfaits ADD COLUMN max_vues_devis INT DEFAULT NULL");
    console.log("Column max_vues_devis added");
  } catch (e) {
    console.log(e.message);
  }
  process.exit();
}
run();
