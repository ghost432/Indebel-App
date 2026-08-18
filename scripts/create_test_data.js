const db = require('../backend/config/database');
const crypto = require('crypto');

async function createTestData() {
  try {
    // Check if test employer exists, otherwise use the first employer found
    let [employers] = await db.query('SELECT id, email, nom, prenom, telephone, ville, code_postal, region FROM users WHERE email = "test-recruteur@indebel.com"');
    let employer;

    if (employers.length === 0) {
      console.log('Test employer not found, finding another employer...');
      [employers] = await db.query('SELECT id, email, nom, prenom, telephone, ville, code_postal, region FROM users WHERE role = "employer" LIMIT 1');
      if (employers.length === 0) {
        console.error('No employer found to inject test data');
        process.exit(1);
      }
    }
    
    employer = employers[0];
    console.log(`Using employer: ${employer.email}`);

    // Create a demande de devis for this employer
    const [result] = await db.query(
      `INSERT INTO demandes_devis 
       (type_travaux, categorie, description, urgence, adresse, code_postal, ville, region,
        prenom, nom, email, telephone, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valide')`,
      [
        'Rénovation complète appartement test',
        'Rénovation & Construction',
        'Ceci est une demande de devis de test pour vérifier la fonctionnalité "Devis reçus" et "Mes demandes".',
        'normal',
        '123 Rue de Test',
        employer.code_postal || '1000',
        employer.ville || 'Bruxelles',
        employer.region || 'Bruxelles-Capitale',
        employer.prenom || 'Test',
        employer.nom || 'Recruteur',
        employer.email,
        employer.telephone || '0400000000'
      ]
    );

    const demandeId = result.insertId;
    console.log(`Created Demande Devis ID: ${demandeId}`);

    // Get a freelancer
    const [freelancers] = await db.query('SELECT id, denomination, prenom, nom FROM users WHERE role = "freelancer" LIMIT 1');
    if (freelancers.length === 0) {
      console.error('No freelancer found to create a quote');
      process.exit(1);
    }
    const freelancer = freelancers[0];

    // Create a devis soumis
    const tokenAction = crypto.randomBytes(24).toString('hex');
    await db.query(
      `INSERT INTO devis_soumis 
       (demande_devis_id, freelancer_id, montant_ht, taux_tva, montant_tva, montant_ttc, montant, description, token_action)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        demandeId,
        freelancer.id,
        1000,
        21,
        210,
        1210,
        1210,
        'Proposition de devis pour la rénovation. Nous sommes disponibles la semaine prochaine.',
        tokenAction
      ]
    );

    console.log('Created Devis Soumis for the demande');
    console.log('Test data created successfully!');
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    process.exit(0);
  }
}

createTestData();
