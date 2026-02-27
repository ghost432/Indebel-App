const { sendEmail, emailTemplates, generateOTP } = require('./config/email');

// Configuration de test
const testEmail = 'mounchilithierry432@gmail.com';
const testName = 'Thierry';

async function sendTestOTP() {
  try {
    console.log('📧 Envoi d\'un email de test OTP...');
    console.log(`📬 Destinataire: ${testEmail}`);
    
    // Générer un code OTP de test
    const otp = generateOTP();
    console.log(`🔐 Code OTP généré: ${otp}`);
    
    // Créer l'email
    const emailConfig = emailTemplates.otpVerification(testName, otp);
    emailConfig.to = testEmail;
    
    // Envoyer l'email
    const result = await sendEmail(emailConfig);
    
    console.log('✅ Email envoyé avec succès!');
    console.log(`📨 Message ID: ${result.messageId}`);
    console.log(`\n🎯 Vérifiez votre boîte mail: ${testEmail}`);
    console.log(`💡 Code de test: ${otp}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le test
sendTestOTP();
