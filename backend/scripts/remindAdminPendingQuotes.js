/**
 * Script pour envoyer un rappel aux admins concernant les demandes de devis en attente
 * À exécuter via cron (ex: tous les jours à 8h)
 */

const db = require('../config/database');
const { sendEmail, getAdminEmails } = require('../config/email');

async function remindAdminPendingQuotes() {
    try {
        console.log('\n📧 VÉRIFICATION DES DEMANDES EN ATTENTE\n');
        console.log(new Date().toISOString());
        console.log('='.repeat(60));

        // Récupérer les demandes en attente
        const [demandes] = await db.query(`
      SELECT id, type_travaux, ville, region, prenom, nom, created_at
      FROM demandes_devis
      WHERE statut = 'en_attente'
      ORDER BY created_at ASC
    `);

        if (demandes.length === 0) {
            console.log('✅ Aucune demande en attente.');
            process.exit(0);
        }

        console.log(`⚠️ ${demandes.length} demande(s) en attente trouvée(s).`);

        // Préparer le contenu de l'email
        const rows = demandes.map(d => {
            const date = new Date(d.created_at).toLocaleDateString('fr-FR');
            return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">#${d.id}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${d.type_travaux}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${d.ville} (${d.region})</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${d.prenom} ${d.nom}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <a href="${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/admin/devis" style="color: #3b82f6; text-decoration: none;">Voir</a>
          </td>
        </tr>
      `;
        }).join('');

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">⚠️ Rappel : Demandes en attente</h2>
        <p>Bonjour,</p>
        <p>Il y a actuellement <strong>${demandes.length} demande(s) de devis</strong> en attente de validation.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left;">
              <th style="padding: 8px; border-bottom: 2px solid #ddd;">ID</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd;">Type</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd;">Lieu</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd;">Client</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd;">Date</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/admin/devis" 
             style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accéder au tableau de bord
          </a>
        </div>
      </div>
    `;

        // Envoyer l'email aux admins
        await sendEmail({
            to: getAdminEmails(),
            subject: `⚠️ Rappel : ${demandes.length} demande(s) de devis en attente validation`,
            html: htmlContent
        });

        console.log('✅ Email de rappel envoyé aux administrateurs.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du rappel:', error);
        process.exit(1);
    }
}

remindAdminPendingQuotes();
