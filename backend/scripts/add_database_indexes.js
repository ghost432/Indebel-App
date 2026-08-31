require('dotenv').config();
const db = require('../config/db');

async function getExistingColumns(tableName) {
  try {
    const [cols] = await db.query(`DESCRIBE \`${tableName}\``);
    return cols.map(c => c.Field);
  } catch (e) {
    return [];
  }
}

async function addIndexSafe(tableName, indexName, columnsArray) {
  try {
    const [tables] = await db.query(`SHOW TABLES LIKE ?`, [tableName]);
    if (tables.length === 0) {
      console.log(`⚠️ Table '${tableName}' non trouvée.`);
      return;
    }

    const availableCols = await getExistingColumns(tableName);
    const validCols = columnsArray.filter(col => availableCols.includes(col));

    if (validCols.length === 0) {
      console.log(`⚠️ Aucune colonne valide (${columnsArray.join(', ')}) dans '${tableName}'. Saut.`);
      return;
    }

    const [indexes] = await db.query(`SHOW INDEX FROM \`${tableName}\` WHERE Key_name = ?`, [indexName]);
    if (indexes.length > 0) {
      console.log(`ℹ️ Index '${indexName}' existe déjà sur '${tableName}'.`);
      return;
    }

    const query = `CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${validCols.map(c => `\`${c}\``).join(', ')})`;
    await db.query(query);
    console.log(`✅ Index '${indexName}' créé sur '${tableName}' (${validCols.join(', ')})`);
  } catch (error) {
    console.error(`❌ Index ${indexName} sur ${tableName}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Début de la vérification et création des index d\'optimisation...');

  // Users
  await addIndexSafe('users', 'idx_users_role', ['role']);
  await addIndexSafe('users', 'idx_users_type_user', ['type_user']);
  await addIndexSafe('users', 'idx_users_email', ['email']);
  await addIndexSafe('users', 'idx_users_verified', ['is_verified']);

  // Missions
  await addIndexSafe('missions', 'idx_missions_user_status', ['user_id', 'status']);
  await addIndexSafe('missions', 'idx_missions_client_id', ['client_id']);

  // Demandes devis
  await addIndexSafe('demandes_devis', 'idx_demandes_statut', ['statut']);
  await addIndexSafe('demandes_devis', 'idx_demandes_email', ['email']);

  // Devis soumis
  await addIndexSafe('devis_soumis', 'idx_devis_freelancer_statut', ['freelancer_id', 'statut']);

  // Notifications
  await addIndexSafe('notifications', 'idx_notif_user_read', ['user_id', 'read_status']);
  await addIndexSafe('notifications', 'idx_notif_user_vu', ['user_id', 'vu']);

  // Factures
  await addIndexSafe('factures', 'idx_factures_user_id', ['user_id']);

  console.log('✨ Optimisation des index terminée avec succès !');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
