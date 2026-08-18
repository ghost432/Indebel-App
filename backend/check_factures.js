const db = require('./config/db');

async function main() {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM factures_forfaits');
    console.log("factures_forfaits columns:", cols.map(c => c.Field));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
