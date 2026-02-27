const db = require('../config/database');
const FactureService = require('../services/factureService');

async function testFacture() {
  let connection;
  
  try {
    console.log('\n🧪 Test de génération de facture...\n');
    
    connection = await db.getConnection();
    
    // Récupérer un utilisateur avec un forfait payant
    const [users] = await connection.query(
      `SELECT u.*, f.nom as forfait_nom, f.prix_mensuel as prix
       FROM users u
       JOIN forfaits f ON u.forfait_id = f.id
       WHERE u.forfait_id IS NOT NULL AND f.prix_mensuel > 0
       LIMIT 1`
    );
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur avec forfait payant trouvé');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    console.log(`   Forfait: ${user.forfait_nom} - ${user.prix}€`);
    
    // Générer une facture de test
    console.log('\n🔄 Génération de la facture...');
    
    const facture = await FactureService.creerFacture(
      connection,
      user.id,
      user.forfait_id,
      new Date(),
      null
    );
    
    if (facture) {
      console.log('\n✅ Facture créée avec succès!');
      console.log(`   Numéro: ${facture.numero_facture}`);
      console.log(`   Montant HT: ${facture.montant_ht}€`);
      console.log(`   TVA: ${facture.montant_tva}€`);
      console.log(`   Montant TTC: ${facture.montant_ttc}€`);
      console.log(`   PDF: ${facture.pdf_path}`);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

testFacture();
