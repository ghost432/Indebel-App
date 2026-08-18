/**
 * Script de vérification de la configuration Stripe
 * Utilisation: node scripts/checkStripeConfig.js
 */

require('dotenv').config();

console.log('\n🔍 Vérification de la configuration Stripe...\n');

let errors = 0;
let warnings = 0;

// Vérifier STRIPE_SECRET_KEY
console.log('1. STRIPE_SECRET_KEY:');
if (!process.env.STRIPE_SECRET_KEY) {
  console.log('   ❌ Non définie');
  errors++;
} else if (process.env.STRIPE_SECRET_KEY === 'your-stripe-secret-key') {
  console.log('   ❌ Valeur par défaut (pas configurée)');
  errors++;
} else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.log('   ⚠️  Mode TEST (sk_test_...)');
  console.log('   💡 Utilisez sk_live_... pour la production');
  warnings++;
} else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  console.log('   ✅ Mode PRODUCTION (sk_live_...)');
} else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.log('   ✅ Configurée');
} else {
  console.log('   ❌ Format invalide (doit commencer par sk_)');
  errors++;
}

// Vérifier STRIPE_PUBLISHABLE_KEY
console.log('\n2. STRIPE_PUBLISHABLE_KEY:');
if (!process.env.STRIPE_PUBLISHABLE_KEY) {
  console.log('   ⚠️  Non définie');
  console.log('   💡 Nécessaire pour le frontend');
  warnings++;
} else if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
  console.log('   ⚠️  Mode TEST (pk_test_...)');
  warnings++;
} else if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')) {
  console.log('   ✅ Mode PRODUCTION (pk_live_...)');
} else if (process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
  console.log('   ✅ Configurée');
} else {
  console.log('   ❌ Format invalide (doit commencer par pk_)');
  errors++;
}

// Vérifier STRIPE_WEBHOOK_SECRET
console.log('\n3. STRIPE_WEBHOOK_SECRET:');
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.log('   ❌ Non définie');
  console.log('   💡 Nécessaire pour vérifier les webhooks');
  errors++;
} else if (process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
  console.log('   ✅ Configurée (whsec_...)');
} else {
  console.log('   ❌ Format invalide (doit commencer par whsec_)');
  errors++;
}

// Vérifier FRONTEND_URL
console.log('\n4. FRONTEND_URL:');
if (!process.env.FRONTEND_URL) {
  console.log('   ❌ Non définie');
  errors++;
} else {
  console.log(`   ✅ ${process.env.FRONTEND_URL}`);
  if (process.env.FRONTEND_URL.includes('localhost')) {
    console.log('   ⚠️  URL locale (développement)');
    warnings++;
  }
}

// Vérifier la cohérence test/prod
console.log('\n5. Cohérence test/production:');
const isSecretTest = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
const isPublicTest = process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');

if (isSecretTest !== isPublicTest) {
  console.log('   ❌ Incohérence: Une clé est en mode test, l\'autre en production');
  errors++;
} else if (isSecretTest && isPublicTest) {
  console.log('   ⚠️  Mode TEST activé');
  warnings++;
} else {
  console.log('   ✅ Mode PRODUCTION activé');
}

// Vérifier l'URL du webhook
console.log('\n6. URL du webhook:');
const webhookUrl = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.replace(/\/$/, '') + '/api/paiement/webhook'
  : 'Non configurée';

if (webhookUrl.includes('localhost')) {
  console.log(`   ⚠️  ${webhookUrl}`);
  console.log('   💡 Utilisez ngrok ou une URL publique pour les webhooks');
  warnings++;
} else if (webhookUrl.startsWith('https://')) {
  console.log(`   ✅ ${webhookUrl}`);
  console.log('   💡 À configurer dans Stripe Dashboard:');
  console.log('      https://dashboard.stripe.com/webhooks');
} else if (webhookUrl.startsWith('http://')) {
  console.log(`   ❌ ${webhookUrl}`);
  console.log('   ⚠️  Stripe nécessite HTTPS pour les webhooks');
  errors++;
} else {
  console.log(`   ❌ URL invalide: ${webhookUrl}`);
  errors++;
}

// Résumé
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log('='.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('\n✅ Configuration parfaite! Stripe est prêt pour la production.\n');
} else {
  if (errors > 0) {
    console.log(`\n❌ ${errors} erreur(s) trouvée(s) - Configuration incomplète`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} avertissement(s) - Configuration à améliorer`);
  }
  console.log('\n');
}

// Afficher les étapes suivantes
if (errors > 0 || warnings > 0) {
  console.log('📝 PROCHAINES ÉTAPES:');
  console.log('─'.repeat(60));
  
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your-stripe-secret-key') {
    console.log('1. Ajoutez STRIPE_SECRET_KEY dans backend/.env');
    console.log('   Récupérer sur: https://dashboard.stripe.com/apikeys');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('2. Ajoutez STRIPE_WEBHOOK_SECRET dans backend/.env');
    console.log('   Créer un webhook sur: https://dashboard.stripe.com/webhooks');
    console.log(`   URL du webhook: ${webhookUrl}`);
  }
  
  if (isSecretTest && isPublicTest) {
    console.log('3. Pour la production, utilisez les clés sk_live_... et pk_live_...');
  }
  
  console.log('\n💡 Après modification, redémarrez le backend:');
  console.log('   cd backend && npm start\n');
}

// Code de sortie
process.exit(errors > 0 ? 1 : 0);
