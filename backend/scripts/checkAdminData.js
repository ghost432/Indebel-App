/**
 * Script pour vérifier les données affichées dans les pages admin
 */

const db = require('../config/database');

async function checkAdminData() {
  try {
    console.log('\n🔍 VÉRIFICATION DES DONNÉES ADMIN\n');
    console.log('='.repeat(60));

    // 1. Vérifier les utilisateurs
    console.log('\n1. UTILISATEURS:');
    const [users] = await db.query(`
      SELECT 
        u.id, u.prenom, u.nom, u.email, u.role, u.statut_verification,
        u.photo_profil, u.forfait_id,
        f.nom AS forfait_nom
      FROM users u
      LEFT JOIN forfaits f ON u.forfait_id = f.id
      ORDER BY u.date_creation DESC
      LIMIT 10
    `);
    
    console.log(`   Total: ${users.length} utilisateurs récents`);
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. [${user.role}] ${user.prenom} ${user.nom} (${user.email})`);
      console.log(`      - Vérification: ${user.statut_verification || 'non_verifie'}`);
      console.log(`      - Photo: ${user.photo_profil ? 'Oui' : 'Non'}`);
      console.log(`      - Forfait: ${user.forfait_nom || 'Aucun'}`);
    });

    // 2. Vérifier les missions
    console.log('\n2. MISSIONS:');
    const [missionsHourly] = await db.query(`
      SELECT COUNT(*) as count FROM missions_forfait_horaire
    `);
    const [missionsFixed] = await db.query(`
      SELECT COUNT(*) as count FROM missions_forfait_fixe
    `);
    console.log(`   - Missions Taux horaire: ${missionsHourly[0].count}`);
    console.log(`   - Missions forfait fixe: ${missionsFixed[0].count}`);
    console.log(`   - Total missions: ${missionsHourly[0].count + missionsFixed[0].count}`);

    // 3. Vérifier les demandes
    console.log('\n3. DEMANDES DE MISSIONS:');
    const [demandes] = await db.query(`
      SELECT COUNT(*) as count FROM demandes_missions
    `);
    console.log(`   - Total demandes: ${demandes[0].count}`);

    // 4. Vérifier les candidatures
    console.log('\n4. CANDIDATURES:');
    const [applications] = await db.query(`
      SELECT COUNT(*) as count FROM applications
    `);
    console.log(`   - Total candidatures: ${applications[0].count}`);

    // 5. Vérifier les vérifications d'identité
    console.log('\n5. VÉRIFICATIONS D\'IDENTITÉ:');
    const [verifications] = await db.query(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM verifications_identite
      GROUP BY statut
    `);
    console.log('   Répartition par statut:');
    verifications.forEach(v => {
      console.log(`   - ${v.statut}: ${v.count}`);
    });

    // 6. Vérifier les forfaits
    console.log('\n6. FORFAITS:');
    const [forfaits] = await db.query(`
      SELECT id, nom, type_utilisateur, prix_mensuel
      FROM forfaits
      ORDER BY prix_mensuel
    `);
    console.log(`   Total: ${forfaits.length} forfaits`);
    forfaits.forEach(f => {
      console.log(`   - ${f.nom} (${f.type_utilisateur}): ${f.prix_mensuel}€/mois`);
    });

    // 7. Vérifier les notifications
    console.log('\n7. NOTIFICATIONS:');
    const [notifications] = await db.query(`
      SELECT COUNT(*) as count, lu
      FROM notifications
      GROUP BY lu
    `);
    console.log('   Répartition:');
    notifications.forEach(n => {
      console.log(`   - ${n.lu ? 'Lues' : 'Non lues'}: ${n.count}`);
    });

    // 8. Vérifier les messages
    console.log('\n8. MESSAGES:');
    const [messages] = await db.query(`
      SELECT COUNT(*) as count FROM messages
    `);
    const [conversations] = await db.query(`
      SELECT COUNT(*) as count FROM conversations
    `);
    console.log(`   - Conversations: ${conversations[0].count}`);
    console.log(`   - Messages: ${messages[0].count}`);

    // 9. Vérifier les secteurs
    console.log('\n9. SECTEURS:');
    const [secteurs] = await db.query(`
      SELECT COUNT(*) as count FROM secteurs
    `);
    console.log(`   - Total secteurs: ${secteurs[0].count}`);

    // 10. Vérifier les évaluations
    console.log('\n10. ÉVALUATIONS:');
    const [evaluations] = await db.query(`
      SELECT COUNT(*) as count FROM evaluations
    `);
    console.log(`   - Total évaluations: ${evaluations[0].count}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Vérification terminée\n');

    // Test API endpoint simulation
    console.log('\n📡 SIMULATION REQUÊTE API:');
    console.log('   GET /api/users/all');
    
    const [apiUsers] = await db.query(`
      SELECT 
        u.id, u.prenom, u.nom, u.email, u.role, u.date_creation,
        u.statut_verification, u.photo_profil,
        f.nom AS forfait_nom
      FROM users u
      LEFT JOIN forfaits f ON u.forfait_id = f.id
      ORDER BY u.date_creation DESC
    `);

    console.log(`   Réponse: ${apiUsers.length} utilisateurs`);
    console.log('   Sample (3 premiers):');
    apiUsers.slice(0, 3).forEach((user, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify({
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut_verification: user.statut_verification,
        photo_profil: user.photo_profil ? 'exists' : null,
        forfait_nom: user.forfait_nom
      }, null, 2).split('\n').join('\n      ')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

checkAdminData();
