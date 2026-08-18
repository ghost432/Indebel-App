require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [cols] = await db.query('SHOW COLUMNS FROM demandes_devis');
  console.log(cols.map(c => c.Field));
  process.exit(0);
}
run();
