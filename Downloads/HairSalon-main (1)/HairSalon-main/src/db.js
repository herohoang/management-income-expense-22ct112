require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Cần thiết khi dùng Railway
  },
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL on Railway"))
  .catch(err => console.error("❌ Connection error", err));

module.exports = pool;
