const db = require('../config/database');

async function checkTable() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM missions_forfait_horaire LIKE 'date%'");
    console.log('Colonnes date dans missions_forfait_horaire:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    const [columns2] = await db.query("SHOW COLUMNS FROM missions_forfait_fixe LIKE 'date%'");
    console.log('\nColonnes date dans missions_forfait_fixe:');
    columns2.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkTable();
