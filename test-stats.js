const db = require('./backend/config/database');

async function test() {
  try {
    let whereClause = 'WHERE employer_id IN (SELECT id FROM users WHERE created_by = ?) OR employer_id = ?';
    let params = [1, 1]; // Assume we test with req.user.id = 1

    let freeWhereClause = whereClause.replace(/employer_id/g, 'freelancer_id');
    
    const [freelancerStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN statut = 'ouvert' THEN 1 ELSE 0 END), 0) as ouverts,
        COALESCE(SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END), 0) as en_cours,
        COALESCE(SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END), 0) as terminees
      FROM jobs_freelancer
      ${freeWhereClause}
    `, params);

    console.log("Success:", freelancerStats);
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
test();
