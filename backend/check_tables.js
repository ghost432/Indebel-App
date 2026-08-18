const db = require('./config/db');

async function main() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log("Tables:", tables);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
