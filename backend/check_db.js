const db = require('./config/database');
async function check() {
  const [rows] = await db.query('DESCRIBE demandes_missions');
  console.log(rows);
  process.exit();
}
check();
