const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const token = jwt.sign({ id: 1, email: 'noreply@indebel.be', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

async function test() {
  const endpoints = [
    '/api/users/stats',
    '/api/jobs/stats',
    '/api/missions/stats',
    '/api/applications/stats',
    '/api/users/all',
    '/api/jobs/all',
    '/api/missions/all',
    '/api/devis/all?limit=10',
    '/api/users/stats/by-city'
  ];

  for (const ep of endpoints) {
    try {
      const res = await global.fetch(`http://127.0.0.1:3000${ep}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.log(`❌ ${ep} failed with status ${res.status}: ${await res.text()}`);
      } else {
        console.log(`✅ ${ep} success.`);
      }
    } catch(e) {
      console.log(`❌ ${ep} error: ${e.message}`);
    }
  }
}
test();
