const pool = require('./db');

const deleteTable = async () => {
  try {
    await pool.query("DROP TABLE IF EXISTS users CASCADE;");
    console.log("✅ Table 'users' has been deleted!");
    process.exit();
  } catch (err) {
    console.error("❌ Error deleting table:", err);
    process.exit(1);
  }
};

deleteTable();
