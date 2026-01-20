const dns = require("dns");

// ÉP PostgreSQL dùng IPv4 (FIX ENETUNREACH trên Render)
dns.setDefaultResultOrder("ipv4first");

const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("LỖI: Chưa cấu hình DATABASE_URL trong file .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
// Đặt timezone mặc định cho tất cả connection
pool.on("connect", (client) => {
  client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
});

(async () => {
  try {
    const client = await pool.connect();
    // Set timezone ngay khi test connection
    await client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
    console.log("✅ PostgreSQL connected successfully!");
    console.log("✅ Timezone set to Asia/Ho_Chi_Minh");
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
