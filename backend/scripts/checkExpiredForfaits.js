// Script cron pour vérifier les forfaits expirés quotidiennement
const forfaitExpirationService = require('../services/forfaitExpirationService');

(async () => {
  try {
    console.log('🔄 Lancement vérification forfaits expirés...');
    console.log('📅 Date:', new Date().toLocaleString('fr-FR'));
    
    const result = await forfaitExpirationService.checkExpiringForfaits();
    
    console.log('\n✅ Vérification terminée:');
    console.log(`   - ${result.expiring7Days} notification(s) 7 jours envoyée(s)`);
    console.log(`   - ${result.expiringToday} notification(s) expiration envoyée(s)`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
})();
