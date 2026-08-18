require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [client] = await db.query('SELECT * FROM users WHERE email = ?', ['mounchilithierry432@gmail.com']);
  const [freelancer] = await db.query('SELECT * FROM users WHERE email = ?', ['ulrichthierry47@gmail.com']);
  
  console.log('Client:', client.length > 0 ? client[0].id + ' - ' + client[0].role : 'NOT FOUND');
  console.log('Freelancer:', freelancer.length > 0 ? freelancer[0].id + ' - ' + freelancer[0].role : 'NOT FOUND');
  process.exit(0);
}
run();
