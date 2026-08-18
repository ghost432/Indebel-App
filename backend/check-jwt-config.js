// Script to verify JWT configuration
require('dotenv').config();

console.log('='.repeat(50));
console.log('🔍 Vérification de la configuration JWT');
console.log('='.repeat(50));

const jwtSecret = process.env.JWT_SECRET;
const jwtExpire = process.env.JWT_EXPIRE;

console.log('\n📋 Configuration JWT:');
console.log('  JWT_SECRET défini:', !!jwtSecret);
console.log('  JWT_SECRET longueur:', jwtSecret?.length || 0);
console.log('  JWT_SECRET aperçu:', jwtSecret ? (jwtSecret.substring(0, 10) + '...') : 'NON DÉFINI');
console.log('  JWT_EXPIRE:', jwtExpire || 'NON DÉFINI (défaut: 7d)');

console.log('\n' + '='.repeat(50));

if (!jwtSecret) {
  console.error('❌ ERREUR: JWT_SECRET n\'est pas défini!');
  console.log('\n💡 Solution:');
  console.log('   1. Copiez le fichier .env.example vers .env');
  console.log('   2. Modifiez JWT_SECRET avec une valeur sécurisée');
  console.log('   3. Redémarrez le serveur backend');
  process.exit(1);
} else if (jwtSecret === 'your_jwt_secret_key_change_this_in_production') {
  console.warn('⚠️  ATTENTION: JWT_SECRET utilise la valeur par défaut!');
  console.log('\n💡 Recommandation:');
  console.log('   Changez JWT_SECRET pour une valeur sécurisée en production');
  console.log('   Exemple: JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'));
} else {
  console.log('✅ Configuration JWT correcte!');
}

console.log('='.repeat(50) + '\n');
