// server/config/db.js
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("LỖI: Chưa cấu hình DATABASE_URL trong file .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  // Nếu deploy lên cloud (Render/Neon) cần bật SSL, chạy local thì không cần
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on("connect", () => {
  console.log("PostgreSQL Database Connected via Connection String!");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
