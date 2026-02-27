const db = require('./config/database');
const additionalNotif = require('./services/additionalNotifications');

async function publishTestMission() {
    const userId = 10;
    const missionData = {
        titre: '🚀 Mission Freelancer Test Integration',
        type_mission: 'Développement Web',
        secteur: 'Informatique',
        langues_parlees: ['Français', 'Anglais'],
        description: 'Ceci est une mission de test pour vérifier l\'intégration des notifications et du flux d\'approbation.',
        competences_requises: ['Node.js', 'React', 'MySQL'],
        taux_horaire: 50,
        heures_estimees: 20,
        type_facturation: 'horaire',
        localisation: 'Bruxelles',
        ville_mission: 'Bruxelles',
        lieu_mission: 'téléhomework',
        autre_lieu: null,
        date_debut: '2026-03-01',
        nombre_independants: 1,
        urgente: false,
        type_forfait: 'hourly',
        statut: 'en_attente_validation'
    };

    try {
        console.log('Publishing mission for user ID 10...');

        const [result] = await db.query(
            `INSERT INTO jobs_freelancer (
        freelancer_id, titre, type_mission, secteur, langues_parlees,
        description, competences_requises, taux_horaire, heures_estimees,
        type_facturation, localisation, ville_mission, lieu_mission, autre_lieu,
        date_debut, nombre_independants, urgente, type_forfait, statut,
        date_creation, date_fermeture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`,
            [
                userId, missionData.titre, missionData.type_mission, missionData.secteur, JSON.stringify(missionData.langues_parlees),
                missionData.description, JSON.stringify(missionData.competences_requises), missionData.taux_horaire, missionData.heures_estimees,
                missionData.type_facturation, missionData.localisation, missionData.ville_mission, missionData.lieu_mission, missionData.autre_lieu,
                missionData.date_debut, missionData.nombre_independants, missionData.urgente, missionData.type_forfait, missionData.statut
            ]
        );

        const missionId = result.insertId;
        console.log(`Mission created with ID: ${missionId}`);

        // Fetch user info for notifications
        const [users] = await db.query('SELECT prenom, nom, email, denomination, role FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // Trigger submission notifications
        console.log('Triggering submission notifications...');
        await additionalNotif.notifyMissionCreation(
            { titre: missionData.titre, type: 'Recrutement Horaire (Prestataire)', budget: '50€/h' },
            { ...user, id: userId },
            true // isFreelancerJob
        );

        console.log('✅ Test mission published and notifications triggered.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error publishing test mission:', error);
        process.exit(1);
    }
}

publishTestMission();
