/**
 * Script pour envoyer des notifications pour les candidatures existantes
 * À exécuter une seule fois pour rattraper les candidatures déjà postulées
 */

const db = require('../config/database');
const { sendEmail } = require('../config/email');
const notificationService = require('../services/notificationService');

async function notifyExistingDemandes() {
  try {
    console.log('🚀 Démarrage du script de notification des candidatures existantes...\n');

    // Récupérer toutes les demandes en attente
    const [demandes] = await db.query(`
      SELECT 
        dm.id,
        dm.mission_id,
        dm.mission_type,
        dm.freelancer_id,
        dm.employer_id,
        dm.message_freelancer,
        dm.date_demande,
        u_freelancer.prenom as freelancer_prenom,
        u_freelancer.nom as freelancer_nom,
        u_freelancer.email as freelancer_email,
        u_freelancer.telephone as freelancer_telephone,
        u_employer.email as employer_email,
        u_employer.denomination as employer_denomination,
        u_employer.prenom as employer_prenom,
        u_employer.nom as employer_nom
      FROM demandes_missions dm
      LEFT JOIN users u_freelancer ON dm.freelancer_id = u_freelancer.id
      LEFT JOIN users u_employer ON dm.employer_id = u_employer.id
      WHERE dm.statut IN ('en_attente', 'accepte', 'refuse', 'terminee')
      ORDER BY dm.date_demande DESC
    `);

    console.log(`📋 ${demandes.length} candidature(s) trouvée(s)\n`);

    let notifiedCount = 0;
    let emailCount = 0;

    for (const demande of demandes) {
      try {
        const freelancerName = `${demande.freelancer_prenom} ${demande.freelancer_nom}`;
        const employerName = demande.employer_denomination || `${demande.employer_prenom} ${demande.employer_nom}`;

        // Récupérer le titre de la mission
        const tableName = demande.mission_type === 'hourly' ? 'missions_forfait_horaire' : 'missions_forfait_fixe';
        const [missions] = await db.query(
          `SELECT titre FROM ${tableName} WHERE id = ?`,
          [demande.mission_id]
        );

        if (missions.length === 0) {
          console.log(`⚠️  Mission ${demande.mission_id} non trouvée, skip demande ${demande.id}`);
          continue;
        }

        const missionTitre = missions[0].titre;

        console.log(`📤 Notification candidature: ${freelancerName} → Mission "${missionTitre}"`);
        console.log(`   Employeur: ${employerName} (${demande.employer_email})`);

        // Envoyer email à l'employeur
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

                ${demande.message_freelancer ? `
                  <div style="margin: 20px 0;">
                    <h4 style="color: #1F2937;">Message de le Prestataire :</h4>
                    <p style="color: #4B5563; font-style: italic;">"${demande.message_freelancer}"</p>
                  </div>
                ` : ''}

                <div style="margin: 20px 0;">
                  <p><strong>Coordonnées de le Prestataire :</strong></p>
                  <ul style="color: #4B5563;">
                    <li>Nom complet : <strong>${freelancerName}</strong></li>
                    <li>Email : ${demande.freelancer_email}</li>
                    ${demande.freelancer_telephone ? `<li>Téléphone : ${demande.freelancer_telephone}</li>` : ''}
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
          console.log(`   ✅ Email envoyé`);
          emailCount++;
        } catch (emailError) {
          console.error(`   ❌ Erreur email: ${emailError.message}`);
        }

        // Créer notification in-app
        try {
          await notificationService.createNotification(
            demande.employer_id,
            'demande',
            `📋 Nouvelle demande pour "${missionTitre}"`,
            `Le Prestataire ${freelancerName} souhaite travailler sur votre mission.`,
            {
              demande_id: demande.id,
              mission_id: demande.mission_id,
              mission_type: demande.mission_type,
              freelancer_id: demande.freelancer_id,
              freelancer_name: freelancerName
            }
          );
          console.log(`   ✅ Notification créée\n`);
          notifiedCount++;
        } catch (notifError) {
          console.error(`   ❌ Erreur notification: ${notifError.message}\n`);
        }

        // Pause de 1 seconde entre chaque demande
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Erreur pour demande ${demande.id}:`, error.message);
      }
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Script terminé avec succès !`);
    console.log(`📊 ${demandes.length} candidatures analysées`);
    console.log(`📧 ${emailCount} emails envoyés`);
    console.log(`🔔 ${notifiedCount} notifications créées`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
notifyExistingDemandes();
