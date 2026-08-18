require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [users] = await db.query('SELECT id, email, role FROM users WHERE email LIKE \'%thierry%\'');
  console.log('Found users:', users);
  process.exit(0);
}
run();
