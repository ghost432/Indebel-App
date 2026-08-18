const fs = require('fs');
const file = 'backend/controllers/notificationController.js';
let content = fs.readFileSync(file, 'utf8');

const sendNewsletter = `
exports.sendNewsletter = async (req, res, next) => {
  try {
    // Only allow admin (or superadmin)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const { sujet, contenu, destinataires } = req.body;

    if (!sujet || !contenu) {
      return res.status(400).json({ success: false, message: 'Sujet et contenu requis' });
    }

    let query = 'SELECT email, prenom, nom, denomination FROM users WHERE role != "admin" AND accepte_emails = TRUE';
    const params = [];

    if (destinataires === 'freelancers') {
      query += ' AND role = "freelancer"';
    } else if (destinataires === 'employers') {
      query += ' AND role = "employer"';
    }
    
    // If it's a sub-admin, only send to users they created
    if (req.user.email !== 'noreply@indebel.be') {
      query += ' AND created_by = ?';
      params.push(req.user.id);
    }

    const [users] = await db.query(query, params);

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun destinataire trouvé (ayant accepté les emails)' });
    }

    // Send emails in background
    (async () => {
      for (const u of users) {
        try {
          const name = u.denomination || u.prenom || u.nom || 'Utilisateur';
          const emailHtml = \`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-top: 5px solid #3b82f6;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Indebel - Newsletter</h1>
                </div>
                <p style="color: #4b5563; font-size: 16px;">Bonjour \${name},</p>
                <div style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 25px 0;">
                  \${contenu}
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; text-align: center;">
                  Vous recevez cet email car vous êtes inscrit sur Indebel.<br/>
                  <strong>L'équipe Indebel</strong>
                </p>
              </div>
            </div>
          \`;

          await sendEmail({
            to: u.email,
            subject: sujet,
            html: emailHtml
          });
          
          // sleep 500ms to avoid rate limiting
          await new Promise(r => setTimeout(r, 500));
        } catch(e) {
          console.error('Erreur envoi newsletter à', u.email, e);
        }
      }
    })();

    res.json({
      success: true,
      message: \`Newsletter en cours d'envoi à \${users.length} utilisateur(s)\`
    });

  } catch (error) {
    next(error);
  }
};
`;

content = content + '\n' + sendNewsletter;
fs.writeFileSync(file, content);
console.log('notificationController.js patched');
