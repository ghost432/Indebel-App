#!/usr/bin/env node

/**
 * Script de test pour les emails du Label Indebel
 * Usage: node scripts/test-label-emails.js [type] [email]
 * Types: approval, rejection, both
 */

const { sendEmail, emailTemplates } = require('../config/email');

async function testLabelEmails() {
  const args = process.argv.slice(2);
  const type = args[0] || 'both';
  const testEmail = args[1] || 'test@indebel.be';

  console.log('📧 Test des emails Label Indebel');
  console.log('================================');
  console.log(`Type: ${type}`);
  console.log(`Email de test: ${testEmail}`);
  console.log('');

  try {
    // Test email d'approbation
    if (type === 'approval' || type === 'both') {
      console.log('1️⃣ Test email d\'approbation:');
      console.log('---------------------------');
      
      const approvalEmail = emailTemplates.labelApproved('Jean', 'Dupont', testEmail);
      console.log(`   Sujet: ${approvalEmail.subject}`);
      console.log(`   Destinataire: ${approvalEmail.to}`);
      
      const result = await sendEmail(approvalEmail);
      if (result.success) {
        console.log('   ✅ Email d\'approbation envoyé avec succès');
        console.log(`   📋 Message ID: ${result.messageId}`);
      } else {
        console.log(`   ❌ Erreur: ${result.error}`);
      }
      console.log('');
    }

    // Test email de refus
    if (type === 'rejection' || type === 'both') {
      console.log('2️⃣ Test email de refus:');
      console.log('------------------------');
      
      const rejectionEmail = emailTemplates.labelRejected('Jean', 'Dupont', testEmail, 'Profil incomplet - il manque les informations de contact et la vérification d\'identité.');
      console.log(`   Sujet: ${rejectionEmail.subject}`);
      console.log(`   Destinataire: ${rejectionEmail.to}`);
      
      const result = await sendEmail(rejectionEmail);
      if (result.success) {
        console.log('   ✅ Email de refus envoyé avec succès');
        console.log(`   📋 Message ID: ${result.messageId}`);
      } else {
        console.log(`   ❌ Erreur: ${result.error}`);
      }
      console.log('');
    }

    console.log('🎉 Test terminé !');
    console.log('');
    console.log('💡 Pour vérifier les emails:');
    console.log('   - Consultez votre boîte de réception');
    console.log('   - Vérifiez le dossier spam/indésirables');
    console.log('   - Les emails viennent de: noreply@indebel.be');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('');
    console.log('🔍 Dépannage:');
    console.log('   1. Vérifiez la connexion internet');
    console.log('   2. Vérifiez la configuration SMTP dans .env');
    console.log('   3. Contactez l\'administrateur système');
    process.exit(1);
  }
}

// Afficher l'aide
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📧 Test des emails Label Indebel

Usage:
  node scripts/test-label-emails.js [type] [email]

Types:
  approval  - Test email d'approbation
  rejection  - Test email de refus  
  both       - Test les deux emails (défaut)

Exemples:
  node scripts/test-label-emails.js
  node scripts/test-label-emails.js approval
  node scripts/test-label-emails.js rejection your@email.com
  node scripts/test-label-emails.js both test@indebel.be

Options:
  --help, -h  - Affiche cette aide
  `);
  process.exit(0);
}

// Exécuter le test
testLabelEmails();
