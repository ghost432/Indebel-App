const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

console.log('\n🧪 TEST COMPLET DE CONNEXION\n');
console.log('═══════════════════════════════════════════════════\n');

async function testCompleteLoginFlow() {
  try {
    console.log('📋 Configuration:');
    console.log(`   API URL: ${API_URL}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET.substring(0, 20)}...`);
    console.log(`   JWT_EXPIRE: ${process.env.JWT_EXPIRE || '7d'}\n`);

    // Étape 1: Login
    console.log('📝 Étape 1: Connexion admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@indebel.com',
      mot_de_passe: 'Admin123!@#'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login échoué:', loginResponse.data.message);
      return;
    }

    const { user, token } = loginResponse.data.data;
    console.log('✅ Login réussi!');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Token: ${token.substring(0, 30)}...\n`);

    // Étape 2: Vérifier le token
    console.log('🔍 Étape 2: Vérification du token...');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token VALIDE');
      console.log(`   User ID dans token: ${decoded.id}`);
      console.log(`   Email dans token: ${decoded.email}`);
      console.log(`   Role dans token: ${decoded.role}`);
      
      const expDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const hoursRemaining = Math.floor((expDate - now) / 1000 / 60 / 60);
      console.log(`   Expire dans: ${hoursRemaining} heures\n`);
    } catch (err) {
      console.log('❌ Token INVALIDE:', err.message);
      console.log('   Cela signifie que le JWT_SECRET utilisé pour la génération et la vérification sont différents!\n');
      return;
    }

    // Étape 3: Test requête protégée
    console.log('🔒 Étape 3: Test requête protégée...');
    try {
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Requête /auth/me réussie');
      console.log(`   User retourné: ${meResponse.data.data.nom}\n`);
    } catch (err) {
      console.log('❌ Requête /auth/me échouée');
      console.log(`   Status: ${err.response?.status}`);
      console.log(`   Message: ${err.response?.data?.message}\n`);
      return;
    }

    // Étape 4: Test support
    console.log('💬 Étape 4: Test endpoint support...');
    try {
      const supportResponse = await axios.get(`${API_URL}/support/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Requête /support/unread-count réussie');
      console.log(`   Compteur: ${supportResponse.data.data.unreadCount}\n`);
    } catch (err) {
      console.log('❌ Requête /support/unread-count échouée');
      console.log(`   Status: ${err.response?.status}`);
      console.log(`   Message: ${err.response?.data?.message}\n`);
      return;
    }

    // Résumé
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📌 Le système est 100% fonctionnel!');
    console.log('📌 Vous pouvez vous connecter avec:');
    console.log(`   Email: admin@indebel.com`);
    console.log(`   Mot de passe: Admin123!@#\n`);

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testCompleteLoginFlow().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
