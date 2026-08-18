const db = require('./config/database');

async function checkTypeFacturation() {
  try {
    console.log('🔍 Vérification des types de facturation...\n');

    const [forfaits] = await db.query(`
      SELECT 
        id,
        nom,
        type_utilisateur,
        type_facturation,
        prix_mensuel
      FROM forfaits
      WHERE actif = TRUE
      ORDER BY type_utilisateur, id
    `);

    console.log('📊 État actuel des forfaits :');
    console.log('─'.repeat(80));
    forfaits.forEach(f => {
      console.log(`ID ${f.id} | ${f.nom} (${f.type_utilisateur})`);
      console.log(`  Prix: ${f.prix_mensuel}€`);
      console.log(`  Type facturation: ${f.type_facturation || 'NULL'}`);
      console.log('─'.repeat(80));
    });

    console.log('\n✅ Vérification terminée !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    process.exit(1);
  }
}

checkTypeFacturation();
