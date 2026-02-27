const db = require('../config/database');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

async function check() {
  try {
    const [rows] = await db.query("SELECT id, nom, type_utilisateur, peut_publier_missions FROM forfaits");
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
