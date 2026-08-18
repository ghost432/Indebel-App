const http = require('http');

const data = JSON.stringify({
  numero_bce: '',
  denomination: '',
  adresse: '',
  poste: '',
  tarif_journalier: '',
  forfait_id: '',
  prenom: 'Admin',
  nom: 'Test',
  nom_partenariat: '',
  admin_permissions: '["seo"]'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/120',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    // Bypass auth if possible? Wait, auth requires token. Let's just mock a token or see if it fails auth.
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
