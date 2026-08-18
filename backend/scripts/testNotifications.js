/**
 * Script de test pour vérifier toutes les notifications
 * Usage: node scripts/testNotifications.js
 */

const additionalNotif = require('../services/additionalNotifications');
const forfaitService = require('../services/forfaitExpirationService');

async function testAllNotifications() {
  console.log('🧪 Test des notifications Indebel\n');
  console.log('=' .repeat(60));

  // Test 1: Notification de bienvenue
  console.log('\n1️⃣ Test notification BIENVENUE (Employer)');
  try {
    await additionalNotif.sendWelcomeNotification(
      999, // ID test
      'test@example.com',
      'Test Recruteur SPRL',
      'employer'
    );
    console.log('✅ Notification bienvenue employer créée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n2️⃣ Test notification BIENVENUE (Freelancer)');
  try {
    await additionalNotif.sendWelcomeNotification(
      998, // ID test
      'freelancer@example.com',
      'Jean Dupont',
      'freelancer'
    );
    console.log('✅ Notification bienvenue freelancer créée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // Test 2: Notification mission publiée
  console.log('\n3️⃣ Test notification MISSION PUBLIÉE');
  try {
    await additionalNotif.sendMissionPublishedNotification(
      999,
      'employer@example.com',
      'Test Recruteur SPRL',
      'Développeur Web Full Stack',
      123
    );
    console.log('✅ Notification + Email mission publiée envoyés');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // Test 3: Notification candidature envoyée
  console.log('\n4️⃣ Test notification CANDIDATURE ENVOYÉE');
  try {
    await additionalNotif.sendApplicationSentNotification(
      998,
      'freelancer@example.com',
      'Jean Dupont',
      'Développeur Web Full Stack'
    );
    console.log('✅ Notification + Email candidature envoyée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // Test 4: Notification forfait expire (7j)
  console.log('\n5️⃣ Test notification FORFAIT EXPIRE DANS 7 JOURS');
  try {
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + 7);
    
    await additionalNotif.sendForfaitExpiringNotification(
      999,
      'employer@example.com',
      'Test Recruteur SPRL',
      'employer',
      'Premium Business',
      dateExpiration
    );
    console.log('✅ Notification + Email forfait expirant envoyés');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // Test 5: Notification forfait expiré
  console.log('\n6️⃣ Test notification FORFAIT EXPIRÉ');
  try {
    const dateExpiration = new Date();
    
    await additionalNotif.sendForfaitExpiredNotification(
      999,
      'employer@example.com',
      'Test Recruteur SPRL',
      'employer',
      'Premium Business',
      dateExpiration
    );
    console.log('✅ Notification + Email forfait expiré envoyés');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // Test 6: Notification freelancers nouvelle mission
  console.log('\n7️⃣ Test notification NOUVELLE MISSION (Tous les Freelancers)');
  try {
    const result = await additionalNotif.notifyFreelancersNewMission(
      'Développeur Full Stack React/Node.js',
      'hourly',
      'Test Recruteur SPRL',
      456
    );
    console.log('✅ Notification nouvelle mission envoyée:');
    console.log(`   - ${result.notifiedCount}/${result.totalFreelancers} freelancer(s) notifié(s)`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // Test 7: Service d'expiration forfaits (cron)
  console.log('\n8️⃣ Test SERVICE EXPIRATION FORFAITS (Cron)');
  try {
    console.log('ℹ️  Ce test vérifie les vrais forfaits en BD...');
    const result = await forfaitService.checkExpiringForfaits();
    console.log('✅ Vérification terminée:');
    console.log(`   - ${result.expiring7Days} forfait(s) expirant dans 7 jours`);
    console.log(`   - ${result.expiringToday} forfait(s) expirant aujourd'hui`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés !\n');
  
  console.log('📝 Prochaines étapes:');
  console.log('   1. Vérifier la table notifications dans la BD');
  console.log('   2. Vérifier les emails envoyés (console logs)');
  console.log('   3. Tester via l\'interface utilisateur');
  console.log('   4. Configurer le cron job pour production\n');
  
  process.exit(0);
}

// Exécuter les tests
testAllNotifications().catch(error => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
