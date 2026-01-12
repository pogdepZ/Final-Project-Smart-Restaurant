const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("LỖI: Chưa cấu hình DATABASE_URL trong file .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // ⚠️ BẮT BUỘC nếu dùng Supabase
}); 

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected successfully!");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:");
    console.error(err);
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
