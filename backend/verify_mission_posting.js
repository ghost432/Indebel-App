const db = require('./config/database');

async function verifyMigration() {
    try {
        console.log('🔍 Vérification de la migration des forfaits...');
        const [forfaits] = await db.query('SELECT id, nom, peut_publier_missions FROM forfaits');
        console.table(forfaits);

        console.log('\n🔍 Test de la logique de permission pour un freelancer...');
        // Simuler un freelancer avec forfait gratuit (Starter - ID 1 ?)
        const freelancerId = 127; // ID arbitraire pour test

        const [userPlan] = await db.query(
            `SELECT f.peut_publier_missions, f.max_missions, 
              (SELECT COUNT(*) FROM jobs WHERE employer_id = u.id) as current_missions
       FROM users u
       JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.id = ?`,
            [freelancerId]
        );

        if (userPlan.length > 0) {
            console.log('Forfait utilisateur:', userPlan[0]);
            if (userPlan[0].peut_publier_missions) {
                console.log('✅ Autorisé à publier');
            } else {
                console.log('❌ Non autorisé à publier (Comportement attendu pour forfait gratuit)');
            }
        } else {
            console.log('Utilisateur non trouvé ou sans forfait');
        }

        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        process.exit(1);
    }
}

verifyMigration();
