const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../config/email');

async function resendMissingNotifs() {
    try {
        console.log('🚀 Starting re-send of missing admin notifications (last 48h)...');

        // 1. Find recent registrations
        const [recentUsers] = await db.query(
            "SELECT prenom, nom, email, role, denomination FROM users WHERE date_creation > DATE_SUB(NOW(), INTERVAL 2 DAY) AND role != 'admin' ORDER BY date_creation DESC"
        );

        console.log(`Found ${recentUsers.length} recent registrations.`);

        for (const user of recentUsers) {
            console.log(`📧 Re-sending registration notif for: ${user.email}`);
            const emailConfig = emailTemplates.newRegistrationAdmin(user);
            await sendEmail(emailConfig);
        }

        // 2. Find recent verification submissions
        const [recentVerifs] = await db.query(
            `SELECT v.*, u.prenom, u.nom, u.email as user_email 
       FROM verifications_identite v
       JOIN users u ON v.freelancer_id = u.id
       WHERE v.date_soumission > DATE_SUB(NOW(), INTERVAL 2 DAY)
       ORDER BY v.date_soumission DESC`
        );

        console.log(`Found ${recentVerifs.length} recent verification submissions.`);

        for (const verif of recentVerifs) {
            console.log(`📧 Re-sending verification notif for: ${verif.user_email}`);
            const emailConfig = emailTemplates.newVerificationAdmin({
                prenom: verif.prenom,
                nom: verif.nom,
                email: verif.user_email,
                type_document: verif.type_document
            });
            await sendEmail(emailConfig);
        }

        console.log('✅ Re-send task completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during re-send:', error);
        process.exit(1);
    }
}

resendMissingNotifs();
