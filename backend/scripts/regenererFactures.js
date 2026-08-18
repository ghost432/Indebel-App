const mysql = require('mysql2/promise');
const FactureService = require('../services/factureService');
require('dotenv').config({ path: '.env.production' });

async function regenererToutesLesFactures() {
  let connection;
  
  try {
    console.log('🔄 Connexion à la base de données...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'indebel_user',
      password: process.env.DB_PASSWORD || 'indebel_pass',
      database: process.env.DB_NAME || 'indebel_bd'
    });

    console.log('✅ Connecté à la base de données');

    // Récupérer toutes les factures
    const [factures] = await connection.query(`
      SELECT f.*, u.prenom, u.nom, u.email, u.numero_bce, u.adresse 
      FROM factures_forfaits f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.date_creation DESC
    `);

    console.log(`📋 ${factures.length} facture(s) trouvée(s)`);

    if (factures.length === 0) {
      console.log('❌ Aucune facture à régénérer');
      return;
    }

    let success = 0;
    let errors = 0;

    // Régénérer chaque facture
    for (const facture of factures) {
      try {
        console.log(`\n🔄 Régénération de ${facture.numero_facture}...`);
        
        const user = {
          prenom: facture.prenom,
          nom: facture.nom,
          email: facture.email,
          numero_bce: facture.numero_bce,
          adresse: facture.adresse
        };

        // Générer le PDF
        const pdfPath = await FactureService.genererPDF(facture, user);

        // Mettre à jour le chemin
        await connection.query(
          'UPDATE factures_forfaits SET pdf_path = ? WHERE id = ?',
          [pdfPath, facture.id]
        );

        console.log(`✅ Facture ${facture.numero_facture} régénérée`);
        success++;

      } catch (error) {
        console.error(`❌ Erreur pour ${facture.numero_facture}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 RÉSULTAT:');
    console.log(`✅ Succès: ${success}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📋 Total: ${factures.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Connexion fermée');
    }
  }
}

// Exécuter
regenererToutesLesFactures();
