const db = require("../config/db");
const tableRepository = require("./tableRepository");

class TableSessionRepository {
  // Tìm session active của bàn
  async findActiveByTableId(tableId) {
    const result = await db.query(
      `SELECT * FROM table_sessions 
       WHERE table_id = $1 AND status = 'active'
       ORDER BY started_at DESC LIMIT 1`,
      [tableId]
    );
    return result.rows[0] || null;
  }

  // Tìm session theo token
  async findBySessionToken(sessionToken) {
    const result = await db.query(
      `SELECT ts.*, t.table_number, t.status as table_status
       FROM table_sessions ts
       JOIN tables t ON ts.table_id = t.id
       WHERE ts.session_token = $1 AND ts.status = 'active'`,
      [sessionToken]
    );
    return result.rows[0] || null;
  }

  // Tạo session mới (không có expiresAt)
  async create({ tableId, userId, sessionToken }) {
    const result = await db.query(
      `INSERT INTO table_sessions (table_id, user_id, session_token, status, started_at)
       VALUES ($1, $2, $3, 'active', NOW())
       RETURNING *`,
      [tableId, userId || null, sessionToken]
    );
    return result.rows[0];
  }

  // Kết thúc session
  async endSession(sessionId) {
    const result = await db.query(
      `UPDATE table_sessions 
       SET status = 'closed', ended_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );
    return result.rows[0];
  }

  // Kết thúc tất cả session active của bàn
  async endAllActiveByTableId(tableId) {
    await db.query(
      `UPDATE table_sessions 
       SET status = 'closed', ended_at = NOW()
       WHERE table_id = $1 AND status = 'active'`,
      [tableId]
    );
  }

  // Cập nhật user cho session (khi khách login sau)
  async updateUserId(sessionId, userId) {
    const result = await db.query(
      `UPDATE table_sessions SET user_id = $1
       WHERE id = $2
       RETURNING *`,
      [userId, sessionId]
    );
    return result.rows[0];
  }

  // Tìm session theo ID
  async findById(sessionId) {
    const result = await db.query(
      `SELECT ts.*, t.table_number, t.status as table_status
       FROM table_sessions ts
       JOIN tables t ON ts.table_id = t.id
       WHERE ts.id = $1`,
      [sessionId]
    );
    return result.rows[0] || null;
  }

  // Tìm session active của user và bàn
  async findActiveByUserAndTable(userId) {
    const result = await db.query(
      `SELECT ts.*, t.table_number, t.status as table_status
       FROM table_sessions ts
       JOIN tables t ON ts.table_id = t.id
       WHERE ts.user_id = $1 AND ts.status = 'active'`,
      [userId]
    );

    console.log("findActiveByUserAndTable result:", result.rows[0]);
    return result.rows[0] || null;
  }
}

module.exports = new TableSessionRepository();
