const db = require('./backend/config/db');

async function test() {
  try {
    const fields = [
      'numero_bce = ?',
      'denomination = ?',
      'adresse = ?',
      'poste = ?',
      'tarif_journalier = ?',
      'forfait_id = ?',
      'prenom = ?',
      'nom = ?',
      'nom_partenariat = ?',
      'admin_permissions = ?'
    ];
    
    // Simulate what gets sent for user 1
    const values = [
      null, // numero_bce is now converted to null
      '',
      '',
      '',
      null, 
      null, 
      'NULL',
      'Admin',
      '',
      '{"pages":["dashboard"],"roles":["freelancer","employer"]}',
      1
    ];

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    console.log("Query:", query);
    console.log("Values:", values);

    try {
      await db.query(query, values);
      console.log("Success!");
    } catch (e) {
      console.error("Failed:", e.message);
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

test();
