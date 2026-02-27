/**
 * Script pour tester l'endpoint /api/demandes/counts
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Créer un token JWT pour l'employeur ID=9
const token = jwt.sign(
  { id: 9, role: 'employer', email: 'mounchilithierry432@gmail.com' },
  process.env.JWT_SECRET || 'your-secret-key-here-123456789',
  { expiresIn: '1h' }
);

console.log('🔑 Token généré:', token.substring(0, 50) + '...');

// Tester l'endpoint
axios.get('http://localhost:5000/api/demandes/counts', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  console.log('\n✅ Réponse de /api/demandes/counts:');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('\n❌ Erreur:', error.response?.data || error.message);
});
