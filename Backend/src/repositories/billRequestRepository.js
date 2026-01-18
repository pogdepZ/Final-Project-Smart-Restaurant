const db = require("../config/db");

class BillRequestRepository {
  // Tạo yêu cầu thanh toán mới
  async create({ tableId, sessionId, note }) {
    const result = await db.query(
      `INSERT INTO bill_requests (table_id, session_id, note, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING *`,
      [tableId, sessionId || null, note || null]
    );
    return result.rows[0];
  }

  // Tìm yêu cầu pending của bàn
  async findPendingByTableId(tableId) {
    const result = await db.query(
      `SELECT br.*, t.table_number
       FROM bill_requests br
       JOIN tables t ON br.table_id = t.id
       WHERE br.table_id = $1 AND br.status = 'pending'
       ORDER BY br.created_at DESC
       LIMIT 1`,
      [tableId]
    );
    return result.rows[0] || null;
  }

  // Lấy tất cả yêu cầu pending (cho Waiter dashboard)
  async findAllPending() {
    const result = await db.query(
      `SELECT br.*, t.table_number, t.location
       FROM bill_requests br
       JOIN tables t ON br.table_id = t.id
       WHERE br.status = 'pending'
       ORDER BY br.created_at ASC`
    );
    return result.rows;
  }

  // Cập nhật trạng thái (acknowledged, completed, cancelled)
  async updateStatus(id, status, handledBy = null) {
    const result = await db.query(
      `UPDATE bill_requests 
       SET status = $1, handled_by = $2, handled_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, handledBy, id]
    );
    return result.rows[0];
  }

  // Tìm theo ID
  async findById(id) {
    const result = await db.query(
      `SELECT br.*, t.table_number
       FROM bill_requests br
       JOIN tables t ON br.table_id = t.id
       WHERE br.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Hủy tất cả pending requests của bàn (khi thanh toán xong)
  async cancelAllPendingByTableId(tableId) {
    await db.query(
      `UPDATE bill_requests 
       SET status = 'completed', handled_at = NOW()
       WHERE table_id = $1 AND (status = 'pending' OR status = 'acknowledged')`,
      [tableId]
    );
  }
}

module.exports = new BillRequestRepository();
