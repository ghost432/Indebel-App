/**
 * Script complet de vérification de toutes les routes API
 * Vérifie la correspondance entre les routes backend et frontend
 */

const fs = require('fs');
const path = require('path');

// Mapping des routes backend (depuis server-complet.js)
const backendRoutes = {
  '/api/auth': 'authRoutes.js',
  '/api/users': 'userRoutes.js',
  '/api/jobs': 'jobRoutes.js',
  '/api/applications': 'applicationRoutes.js',
  '/api/missions': 'missionRoutes.js',
  '/api/messages': 'messageRoutes.js',
  '/api/notifications': 'notificationRoutes.js',
  '/api/support': 'supportRoutes.js',
  '/api/label': 'labelRoutes.js',
  '/api/forfaits': 'forfaitRoutes.js',
  '/api/paiements': 'paiementRoutes.js',  // ⚠️ Pluriel
  '/api/evaluations': 'evaluationRoutes.js',
  '/api/profile-views': 'profileViewRoutes.js',
  '/api/secteurs': 'secteurRoutes.js',
  '/api/demandes': 'demandeRoutes.js',
  '/api/verifications': 'verificationRoutes.js',  // ⚠️ Pluriel
  '/api/pwa': 'pwaRoutes.js',
  '/api/factures': 'factureRoutes.js'
};

// Routes frontend (URL utilisées dans les services)
const frontendServiceRoutes = {
  'authService.js': '/auth',
  'userService.js': '/users',
  'jobService.js': '/jobs',
  'applicationService.js': '/applications',
  'missionService.js': '/missions',
  'messageService.js': '/messages',
  'notificationService.js': '/notifications',
  'supportService.js': '/support',
  'labelService.js': '/label',
  'forfaitService.js': '/forfaits',
  'paiementService.js': '/paiements',  // ✅ Doit être pluriel
  'evaluationService.js': '/evaluations',
  'profileViewService.js': '/profile-views',
  'secteurService.js': '/secteurs',
  'demandeService.js': '/demandes',
  'verificationService.js': '/verifications',  // ✅ Doit être pluriel
  'pwaService.js': '/pwa',
  'factureService.js': '/factures'
};

console.log('🔍 VÉRIFICATION COMPLÈTE DES ROUTES\n');
console.log('═'.repeat(80));

// Vérifier la correspondance
let errors = [];
let warnings = [];

console.log('\n📊 CORRESPONDANCE BACKEND ↔ FRONTEND\n');

Object.entries(backendRoutes).forEach(([backendPath, routeFile]) => {
  const expectedFrontend = backendPath.replace('/api', '');
  const serviceName = routeFile.replace('Routes.js', 'Service.js');
  const frontendPath = frontendServiceRoutes[serviceName];

  if (!frontendPath) {
    warnings.push(`⚠️  Service ${serviceName} introuvable`);
    console.log(`❓ ${backendPath.padEnd(30)} → Service ${serviceName} introuvable`);
  } else if (frontendPath !== expectedFrontend) {
    errors.push({
      backend: backendPath,
      expected: expectedFrontend,
      frontend: frontendPath,
      service: serviceName
    });
    console.log(`❌ ${backendPath.padEnd(30)} → Frontend utilise: ${frontendPath} (❌ Incorrect)`);
  } else {
    console.log(`✅ ${backendPath.padEnd(30)} → ${frontendPath}`);
  }
});

// Afficher les erreurs
if (errors.length > 0) {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('❌ ERREURS DÉTECTÉES\n');
  
  errors.forEach(error => {
    console.log(`Service: ${error.service}`);
    console.log(`  Backend:  ${error.backend}`);
    console.log(`  Attendu:  ${error.expected}`);
    console.log(`  Frontend: ${error.frontend}`);
    console.log(`  🔧 Action: Changer "${error.frontend}" en "${error.expected}" dans ${error.service}`);
    console.log('');
  });
}

// Afficher les warnings
if (warnings.length > 0) {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('⚠️  AVERTISSEMENTS\n');
  
  warnings.forEach(warning => {
    console.log(warning);
  });
}

// Résumé
console.log('\n');
console.log('═'.repeat(80));
console.log('📈 RÉSUMÉ\n');
console.log(`Total routes backend:    ${Object.keys(backendRoutes).length}`);
console.log(`Total services frontend: ${Object.keys(frontendServiceRoutes).length}`);
console.log(`✅ Routes correctes:     ${Object.keys(backendRoutes).length - errors.length}`);
console.log(`❌ Routes incorrectes:   ${errors.length}`);
console.log(`⚠️  Warnings:            ${warnings.length}`);

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n🎉 Toutes les routes correspondent parfaitement !');
  process.exit(0);
} else {
  console.log('\n⚠️  Des corrections sont nécessaires.');
  process.exit(1);
}
