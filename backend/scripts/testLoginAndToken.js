const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

console.log('🧪 Test Login et Vérification Token\n');
console.log('Configuration:');
console.log(`  API URL: ${API_URL}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? 'Défini (' + process.env.JWT_SECRET.substring(0, 10) + '...)' : '❌ MANQUANT'}`);
console.log(`  JWT_EXPIRE: ${process.env.JWT_EXPIRE || '7d (défaut)'}\n`);

async function testLogin() {
  try {
    console.log('📝 Tentative de connexion admin...');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@indebel.com',
      mot_de_passe: 'Admin123!@#'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login échoué:', loginResponse.data.message);
      return;
    }

    console.log('✅ Login réussi!\n');

    const { user, token } = loginResponse.data.data;
    
    console.log('👤 Utilisateur:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}\n`);

    console.log('🔑 Token JWT:');
    console.log(`  ${token.substring(0, 50)}...${token.substring(token.length - 10)}\n`);

    // Décoder le token
    try {
      const decoded = jwt.decode(token);
      console.log('📄 Token décodé (sans vérification):');
      console.log('  Payload:', JSON.stringify(decoded, null, 2));
      
      if (decoded.exp) {
        const expirationDate = new Date(decoded.exp * 1000);
        const now = new Date();
        const remainingHours = Math.floor((expirationDate - now) / 1000 / 60 / 60);
        console.log(`  ⏰ Expire dans: ${remainingHours} heures (${expirationDate.toLocaleString()})\n`);
      }
    } catch (err) {
      console.log('❌ Erreur décodage:', err.message);
    }

    // Vérifier le token avec JWT_SECRET
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token VALIDE avec JWT_SECRET');
      console.log('  Vérification:', JSON.stringify(verified, null, 2), '\n');
    } catch (err) {
      console.log('❌ Token INVALIDE avec JWT_SECRET');
      console.log('  Erreur:', err.message, '\n');
    }

    // Tester une requête protégée avec le token
    console.log('🔒 Test requête protégée: GET /support/unread-count\n');
    
    try {
      const protectedResponse = await axios.get(`${API_URL}/support/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('✅ Requête protégée RÉUSSIE');
      console.log('  Réponse:', JSON.stringify(protectedResponse.data, null, 2), '\n');
    } catch (err) {
      console.log('❌ Requête protégée ÉCHOUÉE');
      console.log('  Status:', err.response?.status);
      console.log('  Message:', err.response?.data?.message);
      console.log('  Erreur complète:', err.message, '\n');
    }

    // Test avec un mauvais token
    console.log('🔒 Test avec token invalide...\n');
    try {
      await axios.get(`${API_URL}/support/unread-count`, {
        headers: {
          Authorization: 'Bearer invalid_token_123'
        }
      });
      console.log('⚠️  Token invalide accepté (problème de sécurité!)\n');
    } catch (err) {
      console.log('✅ Token invalide correctement rejeté');
      console.log('  Status:', err.response?.status);
      console.log('  Message:', err.response?.data?.message, '\n');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
  }
}

console.log('═══════════════════════════════════════════════════\n');
testLogin().then(() => {
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Test terminé\n');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur fatale:', err.message);
  process.exit(1);
});
