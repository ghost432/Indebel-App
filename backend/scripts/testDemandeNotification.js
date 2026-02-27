// Script de test pour email et notification de nouvelle demande
const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('../services/notificationService');

(async () => {
  try {
    console.log('🧪 Test email et notification de nouvelle demande...\n');
    
    // Données de test
    const testData = {
      mission: {
        titre: 'Développement d\'une application web React',
        employer_id: 8, // À adapter selon vos données
        employer_email: 'thierryninja237@gmail.com', // Email de test
        denomination: 'Recruteur Test',
        mission_type: 'hourly'
      },
      freelancer: {
        id: 9, // À adapter
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'freelancer@test.com',
        telephone: '+32 470 123 456'
      },
      message_freelancer: 'Bonjour, je suis très intéressé par cette mission. J\'ai 5 ans d\'expérience en développement React et je pense pouvoir apporter une grande valeur à votre projet.'
    };
    
    const employerName = testData.mission.denomination;
    const freelancerName = `${testData.freelancer.prenom} ${testData.freelancer.nom}`;
    
    console.log('📧 Envoi de l\'email de test...');
    console.log(`   À: ${testData.mission.employer_email}`);
    console.log(`   Employeur: ${employerName}`);
    console.log(`   Prestataire: ${freelancerName}\n`);
    
    // Envoyer l'email
    await sendEmail({
      to: testData.mission.employer_email,
      subject: `Nouvelle demande pour votre mission "${testData.mission.titre}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Nouvelle demande reçue</h2>
          <p>Bonjour ${employerName},</p>
          <p>L'<strong>Prestataire ${freelancerName}</strong> souhaite travailler sur votre mission :</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">${testData.mission.titre}</h3>
            <p style="color: #6B7280; margin: 10px 0;">
              <strong>Type :</strong> ${testData.mission.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #1F2937;">Message de le Prestataire :</h4>
            <p style="color: #4B5563; font-style: italic;">"${testData.message_freelancer}"</p>
          </div>

          <div style="margin: 20px 0;">
            <p><strong>Coordonnées de le Prestataire :</strong></p>
            <ul style="color: #4B5563;">
              <li>Nom complet : <strong>${freelancerName}</strong></li>
              <li>Email : ${testData.freelancer.email}</li>
              <li>Téléphone : ${testData.freelancer.telephone}</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/employer/demandes" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir la demande
            </a>
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Cordialement,<br>
            L'équipe Indebel
          </p>
        </div>
      `
    });
    
    console.log('✅ Email envoyé avec succès!\n');
    
    console.log('🔔 Création de la notification...');
    
    // Créer la notification
    await notificationService.createNotification(
      testData.mission.employer_id,
      'demande',
      `📋 Nouvelle demande pour "${testData.mission.titre}"`,
      `Le Prestataire ${freelancerName} souhaite travailler sur votre mission.`,
      {
        demande_id: 999, // ID fictif pour test
        mission_id: 1,
        mission_type: testData.mission.mission_type,
        freelancer_id: testData.freelancer.id,
        freelancer_name: freelancerName
      }
    );
    
    console.log('✅ Notification créée avec succès!\n');
    
    console.log('📊 Résumé du test:');
    console.log('   ✓ Email envoyé à:', testData.mission.employer_email);
    console.log('   ✓ Notification créée pour l\'employeur ID:', testData.mission.employer_id);
    console.log('   ✓ Mission:', testData.mission.titre);
    console.log('   ✓ Prestataire:', freelancerName);
    console.log('\n🎉 Test terminé avec succès!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
    console.error('Message:', error.message);
    process.exit(1);
  }
})();
