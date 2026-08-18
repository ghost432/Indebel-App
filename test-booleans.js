const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });
(async () => {
  const db = require('./backend/config/database');
  const [res] = await db.query('UPDATE forfaits SET badge_premium = ? WHERE id = 1', [true]);
  console.log(res);
  const [res2] = await db.query('SELECT badge_premium FROM forfaits WHERE id = 1');
  console.log(res2);
  process.exit(0);
})();
