/**
 * Script pour synchroniser les notifications de toutes les demandes existantes
 * Envoie les notifications appropriées selon le statut de chaque demande
 */

const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('../services/notificationService');

async function syncDemandesNotifications() {
  try {
    console.log('🚀 Démarrage de la synchronisation des notifications de demandes...\n');

    // Récupérer toutes les demandes
    const [demandes] = await db.query(`
      SELECT 
        dm.id,
        dm.mission_id,
        dm.mission_type,
        dm.freelancer_id,
        dm.employer_id,
        dm.statut,
        dm.date_demande,
        dm.date_reponse,
        u_freelancer.prenom as freelancer_prenom,
        u_freelancer.nom as freelancer_nom,
        u_freelancer.email as freelancer_email,
        u_employer.denomination as employer_denomination,
        u_employer.prenom as employer_prenom,
        u_employer.nom as employer_nom,
        u_employer.email as employer_email
      FROM demandes_missions dm
      LEFT JOIN users u_freelancer ON dm.freelancer_id = u_freelancer.id
      LEFT JOIN users u_employer ON dm.employer_id = u_employer.id
      ORDER BY dm.date_demande DESC
    `);

    console.log(`📋 ${demandes.length} demande(s) trouvée(s)\n`);

    const stats = {
      en_attente: 0,
      accepte: 0,
      refuse: 0,
      terminee: 0,
      annulee: 0,
      emails_envoyes: 0,
      notifications_creees: 0
    };

    for (const demande of demandes) {
      try {
        const freelancerName = `${demande.freelancer_prenom} ${demande.freelancer_nom}`;
        const employerName = demande.employer_denomination || `${demande.employer_prenom} ${demande.employer_nom}`;

        // Récupérer le titre de la mission
        const tableName = demande.mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
        const [missions] = await db.query(
          `SELECT titre, statut FROM ${tableName} WHERE id = ?`,
          [demande.mission_id]
        );

        if (missions.length === 0) {
          console.log(`⚠️  Demande ${demande.id} : Mission non trouvée (supprimée)`);
          continue;
        }

        const missionTitre = missions[0].titre;
        const missionStatut = missions[0].statut;

        console.log(`\n📤 Demande #${demande.id} : ${freelancerName} → "${missionTitre}"`);
        console.log(`   Statut demande: ${demande.statut} | Statut mission: ${missionStatut}`);
        console.log(`   Employeur: ${employerName}`);

        stats[demande.statut]++;

        // Traiter selon le statut
        switch (demande.statut) {
          case 'en_attente':
            // Notification à l'employeur (demande reçue)
            try {
              await notificationService.createNotification(
                demande.employer_id,
                'demande',
                `📋 Nouvelle demande pour "${missionTitre}"`,
                `Le Prestataire ${freelancerName} souhaite travailler sur votre mission.`,
                { demande_id: demande.id, mission_id: demande.mission_id, mission_type: demande.mission_type }
              );
              stats.notifications_creees++;
              console.log(`   ✅ Notification créée pour employeur`);
            } catch (err) {
              console.error(`   ❌ Erreur notification employeur:`, err.message);
            }

            // Email à l'employeur
            try {
              await sendEmail({
                to: demande.employer_email,
                subject: `Nouvelle demande pour votre mission "${missionTitre}"`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Nouvelle demande reçue</h2>
                    <p>Bonjour ${employerName},</p>
                    <p>L'<strong>Prestataire ${freelancerName}</strong> souhaite travailler sur votre mission :</p>
                    
                    <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #1F2937;">${missionTitre}</h3>
                      <p style="color: #6B7280; margin: 10px 0;">
                        <strong>Type :</strong> ${demande.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
                      </p>
                    </div>

                    <p style="margin-top: 30px;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/employer/demandes" 
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
              stats.emails_envoyes++;
              console.log(`   ✅ Email envoyé à employeur`);
            } catch (err) {
              console.error(`   ❌ Erreur email employeur:`, err.message);
            }
            break;

          case 'accepte':
            // Notification au freelancer (demande acceptée)
            try {
              await notificationService.createNotification(
                demande.freelancer_id,
                'demande',
                `✅ Candidature acceptée !`,
                `Votre candidature pour "${missionTitre}" a été acceptée par ${employerName}. La mission est maintenant en cours.`,
                { demande_id: demande.id, mission_id: demande.mission_id, mission_type: demande.mission_type }
              );
              stats.notifications_creees++;
              console.log(`   ✅ Notification acceptation créée pour freelancer`);

              // Email au freelancer
              await sendEmail({
                to: demande.freelancer_email,
                subject: `Bonne nouvelle ! Votre candidature a été acceptée`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10B981;">🎉 Félicitations !</h2>
                    <p>Bonjour ${freelancerName},</p>
                    <p>Nous avons une excellente nouvelle pour vous !</p>
                    
                    <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                      <h3 style="margin-top: 0; color: #065F46;">Votre candidature a été acceptée</h3>
                      <p style="color: #047857; margin: 10px 0;">
                        <strong>${employerName}</strong> a accepté votre candidature pour la mission :
                      </p>
                      <h4 style="color: #1F2937; margin: 10px 0;">"${missionTitre}"</h4>
                    </div>

                    <p style="margin-top: 20px;">
                      La mission est maintenant <strong>en cours</strong>. Vous pouvez contacter l'employeur pour convenir des prochaines étapes.
                    </p>

                    <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                      Bon travail !<br>
                      L'équipe Indebel
                    </p>
                  </div>
                `
              });
              stats.emails_envoyes++;
              console.log(`   ✅ Email acceptation envoyé`);
            } catch (err) {
              console.error(`   ❌ Erreur notification/email acceptation:`, err.message);
            }

            // Vérifier et corriger le statut de la mission
            if (missionStatut !== 'en_cours') {
              console.log(`   ⚠️  Mission en statut "${missionStatut}" mais devrait être "en_cours"`);
              await db.query(
                `UPDATE ${tableName} SET statut = 'en_cours' WHERE id = ?`,
                [demande.mission_id]
              );
              console.log(`   ✅ Statut mission corrigé: en_cours`);
            }
            break;

          case 'refuse':
            // Notification au freelancer (demande refusée)
            try {
              await notificationService.createNotification(
                demande.freelancer_id,
                'demande',
                `📋 Réponse à votre candidature`,
                `Votre candidature pour "${missionTitre}" n'a pas été retenue. Ne vous découragez pas, de nouvelles opportunités vous attendent !`,
                { demande_id: demande.id, mission_id: demande.mission_id, mission_type: demande.mission_type }
              );
              stats.notifications_creees++;
              console.log(`   ✅ Notification refus créée pour freelancer`);

              // Email au freelancer
              await sendEmail({
                to: demande.freelancer_email,
                subject: `Réponse à votre candidature - ${missionTitre}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Réponse à votre candidature</h2>
                    <p>Bonjour ${freelancerName},</p>
                    
                    <p>Nous vous remercions pour votre intérêt pour la mission :</p>
                    <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: #1F2937;">"${missionTitre}"</h3>
                      <p style="color: #6B7280; margin: 10px 0;">Publiée par <strong>${employerName}</strong></p>
                    </div>

                    <p>Malheureusement, votre candidature n'a pas été retenue pour cette mission.</p>
                    
                    <p style="margin-top: 20px;">
                      Ne vous découragez pas ! De nombreuses autres opportunités vous attendent sur Indebel.
                    </p>

                    <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                      Cordialement,<br>
                      L'équipe Indebel
                    </p>
                  </div>
                `
              });
              stats.emails_envoyes++;
              console.log(`   ✅ Email refus envoyé`);
            } catch (err) {
              console.error(`   ❌ Erreur notification/email refus:`, err.message);
            }
            break;

          case 'terminee':
            console.log(`   ℹ️  Demande terminée, pas d'action nécessaire`);
            break;

          case 'annulee':
            console.log(`   ℹ️  Demande annulée, pas d'action nécessaire`);
            break;
        }

        // Pause de 1 seconde entre chaque demande
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Erreur pour demande ${demande.id}:`, error.message);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ Synchronisation terminée avec succès !`);
    console.log(`\n📊 STATISTIQUES:`);
    console.log(`   Total demandes: ${demandes.length}`);
    console.log(`   - En attente: ${stats.en_attente}`);
    console.log(`   - Acceptées: ${stats.accepte}`);
    console.log(`   - Refusées: ${stats.refuse}`);
    console.log(`   - Terminées: ${stats.terminee}`);
    console.log(`   - Annulées: ${stats.annulee}`);
    console.log(`\n📧 ${stats.emails_envoyes} emails envoyés`);
    console.log(`🔔 ${stats.notifications_creees} notifications créées`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
syncDemandesNotifications();
