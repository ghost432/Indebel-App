#!/usr/bin/env node

/**
 * Script pour envoyer les emails d'approbation du label
 * aux utilisateurs qui ont déjà un label actif
 */

const { sendEmail, emailTemplates } = require('../config/email');
const db = require('../config/database');

async function sendLabelApprovalEmails() {
  console.log('📧 Envoi des emails d\'approbation du Label Indebel');
  console.log('==================================================');
  console.log('');

  try {
    // Connexion à la base de données
    console.log('🔍 Connexion à la base de données...');
    await db.query('SELECT 1');
    console.log('✅ Base de données connectée');

    // Récupérer tous les utilisateurs avec un label accepté
    console.log('📋 Recherche des utilisateurs avec label actif...');
    const [labels] = await db.query(`
      SELECT l.user_id, l.date_attribution, l.date_demande, 
             u.prenom, u.nom, u.email, u.role, u.statut_verification
      FROM label_indebel l
      JOIN users u ON l.user_id = u.id
      WHERE l.statut = 'accepte'
      ORDER BY l.date_attribution DESC
    `);

    console.log(`📊 ${labels.length} utilisateur(s) avec label actif trouvé(s)`);
    console.log('');

    if (labels.length === 0) {
      console.log('ℹ️  Aucun utilisateur avec label actif trouvé');
      process.exit(0);
    }

    // Envoyer les emails
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      console.log(`📧 [${i + 1}/${labels.length}] Envoi à: ${label.prenom || 'Nom inconnu'} ${label.nom || ''} (${label.email})`);
      
      try {
        const emailConfig = emailTemplates.labelApproved(label.prenom, label.nom, label.email);
        const result = await sendEmail(emailConfig);
        
        if (result.success) {
          console.log(`   ✅ Email envoyé avec succès (ID: ${result.messageId})`);
          successCount++;
        } else {
          console.log(`   ❌ Erreur: ${result.error}`);
          errorCount++;
        }
      } catch (emailError) {
        console.error(`   ❌ Erreur critique: ${emailError.message}`);
        errorCount++;
      }

      // Pause entre les emails pour éviter le spam
      if (i < labels.length - 1) {
        console.log('   ⏳ Pause de 1 seconde...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('');
    }

    // Résumé
    console.log('📊 Résumé de l\'envoi:');
    console.log('====================');
    console.log(`✅ Emails envoyés avec succès: ${successCount}`);
    console.log(`❌ Emails en erreur: ${errorCount}`);
    console.log(`📋 Total traité: ${labels.length}`);
    console.log('');

    if (successCount > 0) {
      console.log('🎉 Les utilisateurs ont été notifiés de leur label actif !');
      console.log('💡 Ils devraient voir leur badge sur leur profil.');
    }

    if (errorCount > 0) {
      console.log('⚠️  Certains emails n\'ont pas pu être envoyés.');
      console.log('🔍 Vérifiez les logs et la configuration SMTP.');
    }

    process.exit(errorCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.log('');
    console.log('🔍 Dépannage:');
    console.log('   1. Vérifiez la connexion à la base de données');
    console.log('   2. Vérifiez la configuration SMTP');
    console.log('   3. Vérifiez les permissions de la table label_indebel');
    console.log('   4. Contactez l\'administrateur système');
    process.exit(1);
  }
}

// Afficher l'aide
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📧 Envoi des emails d'approbation du Label Indebel

Ce script envoie les emails de notification aux utilisateurs
qui ont déjà un label actif dans la base de données.

Usage:
  node scripts/send-label-approval-emails.js

Options:
  --help, -h  - Affiche cette aide

Fonctionnement:
  1. Recherche tous les utilisateurs avec label.statut = 'accepte'
  2. Envoie un email d'approbation à chaque utilisateur
  3. Affiche un résumé des envois réussis/échoués

Note:
  - Une pause de 1 seconde est faite entre chaque email
  - Les emails sont envoyés via le template labelApproved
  - Les erreurs sont loguées mais n'arrêtent pas le script
  `);
  process.exit(0);
}

// Confirmation pour éviter les envois accidentels
if (process.argv.includes('--confirm') || process.env.NODE_ENV === 'production') {
  sendLabelApprovalEmails();
} else {
  console.log('⚠️  Mode de développement détecté');
  console.log('🔒 Pour envoyer les emails, utilisez --confirm');
  console.log('');
  console.log('Exemple:');
  console.log('  node scripts/send-label-approval-emails.js --confirm');
  console.log('');
  console.log('Ou utilisez --help pour plus d\'informations');
  process.exit(0);
}
