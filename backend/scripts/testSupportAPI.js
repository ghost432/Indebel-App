const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

console.log('🧪 Test des routes API Support\n');
console.log(`API URL: ${API_URL}\n`);

// Test avec un token valide (à remplacer par un vrai token)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMjc4MTY5NiwiZXhwIjoxNzM1MzczNjk2fQ.example'; // Token d'exemple

async function testAPI() {
  try {
    // Test 1: Obtenir le compteur sans authentification (devrait échouer)
    console.log('Test 1: GET /support/unread-count (sans token)');
    try {
      await axios.get(`${API_URL}/support/unread-count`);
      console.log('  ❌ Devrait échouer sans token\n');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('  ✅ Erreur 401 - Authentification requise (attendu)\n');
      } else {
        console.log(`  ⚠️  Erreur: ${error.message}\n`);
      }
    }

    // Test 2: Vérifier que la route existe
    console.log('Test 2: Vérification de la disponibilité de l\'API');
    try {
      await axios.get(`${API_URL.replace('/api', '')}/health`);
      console.log('  ✅ API disponible\n');
    } catch (error) {
      console.log(`  ⚠️  Health check échoué: ${error.message}`);
      console.log('  Tentative sur la racine...');
      try {
        await axios.get(API_URL.replace('/api', ''));
        console.log('  ✅ Serveur répond\n');
      } catch (err) {
        console.log(`  ❌ Serveur ne répond pas: ${err.message}\n`);
      }
    }

    // Test 3: Vérifier les routes publiques
    console.log('Test 3: GET /auth/check-email (route publique)');
    try {
      await axios.post(`${API_URL}/auth/check-email`, { email: 'test@test.com' });
      console.log('  ✅ Route publique accessible\n');
    } catch (error) {
      if (error.response) {
        console.log(`  ✅ Route existe (status ${error.response.status})\n`);
      } else {
        console.log(`  ❌ Erreur: ${error.message}\n`);
      }
    }

    console.log('📋 Résumé:');
    console.log('  - Les routes API nécessitent une authentification JWT');
    console.log('  - Assurez-vous d\'envoyer le token dans le header Authorization');
    console.log('  - Format: Authorization: Bearer {token}\n');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testAPI().then(() => {
  console.log('✅ Tests terminés\n');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
