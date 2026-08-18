require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    // 1. Get the submitted devis token
    const [devis] = await db.query('SELECT token_action, statut FROM devis_soumis WHERE demande_devis_id = 42 ORDER BY id DESC LIMIT 1');
    if (devis.length === 0) {
      console.log('No devis found');
      return;
    }
    const token = devis[0].token_action;
    console.log('Initial Status:', devis[0].statut);
    
    // 2. Client Accepts Devis
    const acceptRes = await axios.post('http://localhost:5000/api/devis-soumis/reponse-client', {
      token: token,
      action: 'accepter'
    });
    console.log('Client Accept Response:', acceptRes.data.success);
    
    // 3. Login as Freelancer
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'ulrichthierry47@gmail.com',
      mot_de_passe: 'Password123!'
    });
    const authToken = loginRes.data.data.token;
    
    // 4. Check Dashboard Status
    const dashboardRes = await axios.get('http://localhost:5000/api/devis-soumis/mes-devis', {
      headers: { Authorization: 'Bearer ' + authToken }
    });
    const dashboardDevis = dashboardRes.data.data.find(d => d.token_action === token);
    console.log('Freelancer Dashboard Status:', dashboardDevis ? dashboardDevis.statut : 'Not Found');
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.response ? e.response.data : e.message);
    process.exit(1);
  }
}
run();
