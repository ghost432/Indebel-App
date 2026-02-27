/**
 * Script de vérification de toutes les routes API
 * Vérifie que toutes les routes déclarées existent et sont accessibles
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Liste de toutes les routes à vérifier
const routes = {
  'Health': [
    { method: 'GET', path: '/health', auth: false }
  ],
  'Auth': [
    { method: 'POST', path: '/auth/register', auth: false },
    { method: 'POST', path: '/auth/login', auth: false }
  ],
  'Users': [
    { method: 'GET', path: '/users/profile', auth: true }
  ],
  'Jobs': [
    { method: 'GET', path: '/jobs', auth: false }
  ],
  'Applications': [
    { method: 'GET', path: '/applications/my-applications', auth: true }
  ],
  'Missions': [
    { method: 'GET', path: '/missions', auth: true }
  ],
  'Messages': [
    { method: 'GET', path: '/messages/conversations', auth: true }
  ],
  'Notifications': [
    { method: 'GET', path: '/notifications', auth: true }
  ],
  'Support': [
    { method: 'GET', path: '/support/tickets', auth: true }
  ],
  'Label': [
    { method: 'POST', path: '/label/verifier-criteres', auth: true },
    { method: 'POST', path: '/label/exceptional-request', auth: true }
  ],
  'Forfaits': [
    { method: 'GET', path: '/forfaits', auth: false }
  ],
  'Paiements': [
    { method: 'GET', path: '/paiements/methods', auth: true }
  ],
  'Evaluations': [
    { method: 'GET', path: '/evaluations', auth: true }
  ],
  'Profile Views': [
    { method: 'GET', path: '/profile-views/stats', auth: true }
  ],
  'Secteurs': [
    { method: 'GET', path: '/secteurs/with-competences', auth: false }
  ],
  'Demandes': [
    { method: 'GET', path: '/demandes', auth: true }
  ],
  'Verifications': [
    { method: 'GET', path: '/verifications/status', auth: true },
    { method: 'POST', path: '/verifications/submit', auth: true }
  ],
  'PWA': [
    { method: 'GET', path: '/pwa/admin/statistiques', auth: true }
  ],
  'Factures': [
    { method: 'GET', path: '/factures', auth: true }
  ]
};

async function verifierRoute(category, route) {
  const url = `${API_BASE_URL}${route.path}`;
  try {
    const config = {
      method: route.method,
      url,
      validateStatus: (status) => status < 500 // Accepter tout sauf 500+
    };

    if (route.auth) {
      // Pour les routes authentifiées, on s'attend à un 401 sans token
      config.headers = {};
    }

    const response = await axios(config);
    
    // Si authentification requise, 401 est normal
    if (route.auth && response.status === 401) {
      return { success: true, status: 401, message: 'Auth required (OK)' };
    }
    
    // Si route existe
    if (response.status === 404) {
      return { success: false, status: 404, message: '❌ Route non trouvée' };
    }
    
    if (response.status >= 200 && response.status < 300) {
      return { success: true, status: response.status, message: '✅ OK' };
    }
    
    if (response.status >= 400 && response.status < 500) {
      return { success: true, status: response.status, message: '✅ Route existe' };
    }
    
    return { success: false, status: response.status, message: `⚠️ Status ${response.status}` };
    
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        return { success: false, status: 404, message: '❌ Route non trouvée' };
      }
      if (error.response.status === 401 && route.auth) {
        return { success: true, status: 401, message: '✅ Auth required (OK)' };
      }
      return { success: true, status: error.response.status, message: '✅ Route existe' };
    }
    return { success: false, status: 0, message: `❌ Erreur: ${error.message}` };
  }
}

async function verifierToutesLesRoutes() {
  console.log('🔍 Vérification de toutes les routes API');
  console.log(`📍 URL: ${API_BASE_URL}\n`);

  let totalRoutes = 0;
  let routesOK = 0;
  let routesKO = 0;
  const problemes = [];

  for (const [category, routesList] of Object.entries(routes)) {
    console.log(`\n📂 ${category}`);
    console.log('─'.repeat(60));

    for (const route of routesList) {
      totalRoutes++;
      const result = await verifierRoute(category, route);
      
      const authBadge = route.auth ? '🔒' : '🌐';
      const statusBadge = result.success ? '✅' : '❌';
      
      console.log(`${statusBadge} ${authBadge} ${route.method.padEnd(6)} ${route.path.padEnd(40)} [${result.status}] ${result.message}`);
      
      if (result.success) {
        routesOK++;
      } else {
        routesKO++;
        problemes.push({
          category,
          method: route.method,
          path: route.path,
          status: result.status,
          message: result.message
        });
      }
      
      // Petit délai pour ne pas surcharger
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Résumé
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('═'.repeat(60));
  console.log(`Total routes testées: ${totalRoutes}`);
  console.log(`✅ Routes OK:         ${routesOK} (${Math.round(routesOK/totalRoutes*100)}%)`);
  console.log(`❌ Routes KO:         ${routesKO} (${Math.round(routesKO/totalRoutes*100)}%)`);

  if (problemes.length > 0) {
    console.log('\n❌ PROBLÈMES DÉTECTÉS:');
    console.log('─'.repeat(60));
    problemes.forEach(p => {
      console.log(`\n${p.category}:`);
      console.log(`  ${p.method} ${p.path}`);
      console.log(`  Status: ${p.status} - ${p.message}`);
    });
  } else {
    console.log('\n🎉 Toutes les routes sont opérationnelles!');
  }

  console.log('\n');
  process.exit(problemes.length > 0 ? 1 : 0);
}

// Exécuter
verifierToutesLesRoutes().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
