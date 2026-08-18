const db = require('/var/www/vhosts/indebel.be/pro.indebel.be/api/config/database');

(async () => {
  const [rows] = await db.query(
    'SELECT id,type_travaux,categorie,statut,LENGTH(fichiers_joints) file_len, LEFT(fichiers_joints,80) file_start FROM demandes_devis WHERE id IN (26,27) ORDER BY id'
  );
  const [pub] = await db.query(
    'SELECT id,type_travaux,LENGTH(fichiers_joints) file_len FROM demandes_devis WHERE statut = ? ORDER BY created_at DESC LIMIT 8',
    ['valide']
  );
  console.log(JSON.stringify({ rows, pub }, null, 2));
  process.exit(0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
