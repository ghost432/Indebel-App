const db = require('./config/database');
async function fix() {
  try {
    await db.query('ALTER TABLE demandes_missions ADD COLUMN is_freelancer_job BOOLEAN DEFAULT 0;');
    console.log("Column added");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists");
    } else {
      console.error(e);
    }
  }
  process.exit();
}
fix();
