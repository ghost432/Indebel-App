/**
 * Script pour tester les endpoints API utilisés par les pages admin
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Token admin à récupérer après connexion
let ADMIN_TOKEN = '';

async function testEndpoints() {
  try {
    console.log('\n🧪 TEST DES ENDPOINTS API ADMIN\n');
    console.log('='.repeat(60));

    // 1. Login admin pour obtenir le token
    console.log('\n1. LOGIN ADMIN...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@indebel.com',
        password: 'Admin123!'
      });
      
      ADMIN_TOKEN = loginResponse.data.data.token;
      console.log('   ✅ Login réussi');
      console.log('   Token:', ADMIN_TOKEN.substring(0, 20) + '...');
    } catch (error) {
      console.log('   ❌ Login échoué:', error.response?.data?.message || error.message);
      console.log('   Essai avec autre email...');
      
      try {
        const loginResponse2 = await axios.post(`${API_URL}/auth/login`, {
          email: 'noreply@indebel.be',
          password: 'Admin123!'
        });
        ADMIN_TOKEN = loginResponse2.data.data.token;
        console.log('   ✅ Login réussi avec noreply@indebel.be');
      } catch (error2) {
        console.log('   ❌ Login impossible. Créez un admin d\'abord.');
        process.exit(1);
      }
    }

    const headers = {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    };

    // 2. Test GET /api/users/all
    console.log('\n2. GET /api/users/all');
    try {
      const response = await axios.get(`${API_URL}/users/all`, { headers });
      console.log('   ✅ Status:', response.status);
      console.log('   📊 Données reçues:', response.data.data?.length, 'utilisateurs');
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('   📋 Premier utilisateur:');
        const user = response.data.data[0];
        console.log('      - ID:', user.id);
        console.log('      - Nom:', user.nom, user.prenom);
        console.log('      - Email:', user.email);
        console.log('      - Role:', user.role);
        console.log('      - Statut vérification:', user.statut_verification);
        console.log('      - Photo profil:', user.photo_profil ? 'Oui (' + user.photo_profil.substring(0, 30) + '...)' : 'Non');
        console.log('      - Forfait:', user.forfait_nom || 'Aucun');
      }
    } catch (error) {
      console.log('   ❌ Erreur:', error.response?.data?.message || error.message);
    }

    // 3. Test GET /api/missions/all
    console.log('\n3. GET /api/missions/all');
    try {
      const response = await axios.get(`${API_URL}/missions/all`, { headers });
      console.log('   ✅ Status:', response.status);
      console.log('   📊 Données reçues:', response.data.data?.length, 'missions');
    } catch (error) {
      console.log('   ❌ Erreur:', error.response?.data?.message || error.message);
    }

    // 4. Test GET /api/demandes/all
    console.log('\n4. GET /api/demandes/all');
    try {
      const response = await axios.get(`${API_URL}/demandes/all`, { headers });
      console.log('   ✅ Status:', response.status);
      console.log('   📊 Données reçues:', response.data.data?.length, 'demandes');
    } catch (error) {
      console.log('   ❌ Erreur:', error.response?.data?.message || error.message);
    }

    // 5. Test GET /api/applications/all
    console.log('\n5. GET /api/applications/all');
    try {
      const response = await axios.get(`${API_URL}/applications/all`, { headers });
      console.log('   ✅ Status:', response.status);
      console.log('   📊 Données reçues:', response.data.data?.length, 'candidatures');
    } catch (error) {
      console.log('   ❌ Erreur:', error.response?.data?.message || error.message);
    }

    // 6. Test GET /api/verifications/all
    console.log('\n6. GET /api/verifications/all');
    try {
      const response = await axios.get(`${API_URL}/verifications/all`, { headers });
      console.log('   ✅ Status:', response.status);
      console.log('   📊 Données reçues:', response.data.data?.length, 'vérifications');
    } catch (error) {
      console.log('   ❌ Erreur:', error.response?.data?.message || error.message);
    }

    // 7. Test GET /api/forfaits
    console.log('\n7. GET /api/forfaits');
    try {
      const response = await axios.get(`${API_URL}/forfaits`, { headers });
      console.log('   ✅ Status:', response.status);
      console.log('   📊 Données reçues:', response.data.data?.length, 'forfaits');
    } catch (error) {
      console.log('   ❌ Erreur:', error.response?.data?.message || error.message);
    }

    // 8. Test GET /api/notifications
    console.log('\n8. GET /api/notifications');
    try {
      const response = await axios.get(`${API_URL}/notifications`, { headers });
      console.log('   ✅ Status:', response.status);
      console.log('   📊 Données reçues:', response.data.data?.length, 'notifications');
    } catch (error) {
      console.log('   ❌ Erreur:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tests terminés\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur générale:', error.message);
    process.exit(1);
  }
}

// Vérifier que le serveur est démarré
console.log('⚠️  Assurez-vous que le backend est démarré sur http://localhost:5000');
console.log('   Lancez: cd backend && npm start\n');

setTimeout(() => {
  testEndpoints();
}, 1000);
