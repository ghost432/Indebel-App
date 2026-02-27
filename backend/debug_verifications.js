const db = require('./config/database');

async function debugVerifications() {
    try {
        console.log('--- Debugging Verifications ---');

        // 1. Check table existence
        console.log('\n1. Checking table existence...');
        const [tables] = await db.query("SHOW TABLES LIKE 'verifications_identite'");
        console.log('Table exists:', tables.length > 0);

        if (tables.length === 0) {
            console.log('Creating table if it does not exist (it should exist)...');
            // ... potentially create table code here if needed, but for now just report
            return;
        }

        // 2. Check columns
        console.log('\n2. Checking columns...');
        const [columns] = await db.query("SHOW COLUMNS FROM verifications_identite");
        console.log('Columns:', columns.map(c => c.Field).join(', '));

        // 3. Count records
        console.log('\n3. Counting records...');
        const [count] = await db.query("SELECT COUNT(*) as count FROM verifications_identite");
        console.log('Total records:', count[0].count);

        // 4. Test the controller query
        console.log('\n4. Testing controller query...');
        const query = `
      SELECT 
        v.id, v.freelancer_id, u.prenom, u.nom
      FROM verifications_identite v
      INNER JOIN users u ON v.freelancer_id = u.id
      LEFT JOIN users admin ON v.traite_par = admin.id
      LIMIT 5
    `;
        const [results] = await db.query(query);
        console.log('Controller query results (first 5):', results);

        // 5. Check for orphaned records
        console.log('\n5. Checking for orphaned records (verifications without users)...');
        const [orphans] = await db.query("SELECT v.id, v.freelancer_id FROM verifications_identite v LEFT JOIN users u ON v.freelancer_id = u.id WHERE u.id IS NULL");
        console.log('Orphaned records:', orphans);

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        process.exit();
    }
}

debugVerifications();
