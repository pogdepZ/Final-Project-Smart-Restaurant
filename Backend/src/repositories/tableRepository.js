const db = require("../config/db");

class TableRepository {
  // 1. Get All (Filter & Sort)
  async getAll({ status, location, sortQuery }) {
    let query = `SELECT * FROM tables WHERE 1=1`;
    const params = [];

    if (status && status !== "") {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (location && location !== "") {
      params.push(`%${location}%`);
      query += ` AND location ILIKE $${params.length}`;
    }

    // 3. SORT
    // sortQuery được truyền từ Controller xuống (ví dụ: " ORDER BY capacity DESC")
    if (sortQuery) {
      query += sortQuery;
    } else {
      query += " ORDER BY table_number ASC"; // Mặc định
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  // 2. Find By Number (Check duplicate)
  async findByNumber(table_number) {
    const result = await db.query(
      "SELECT * FROM tables WHERE table_number = $1",
      [table_number],
    );
    return result.rows[0];
  }

  // 3. Find By Number Except ID (Check duplicate when update)
  async findByNumberExceptId(table_number, id) {
    const result = await db.query(
      "SELECT id FROM tables WHERE table_number = $1 AND id != $2",
      [table_number, id],
    );
    return result.rows[0];
  }

  // 4. Create
  async create({ table_number, capacity, location, description, qr_token }) {
    const result = await db.query(
      `INSERT INTO tables (table_number, capacity, location, description, qr_token, status) 
             VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [table_number, capacity, location, description, qr_token],
    );
    return result.rows[0];
  }

  // 5. Update
  async update(id, { table_number, capacity, location, description, status }) {
    // Dùng COALESCE để giữ nguyên giá trị cũ nếu params truyền vào là undefined
    // Tuy nhiên, khi dùng Repository, thường Controller sẽ chuẩn bị object đầy đủ.
    // Ở đây ta giữ logic COALESCE cho linh hoạt.
    const result = await db.query(
      `UPDATE tables SET 
                table_number = COALESCE($1, table_number),
                capacity = COALESCE($2, capacity),
                location = COALESCE($3, location),
                description = COALESCE($4, description),
                status = COALESCE($5, status)
            WHERE id = $6 RETURNING *`,
      [table_number, capacity, location, description, status, id],
    );
    return result.rows[0];
  }

  // 6. Check Active Orders (Warning logic)
  async countActiveOrders(tableId) {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE table_id = $1 AND status NOT IN ('completed', 'rejected')`,
      [tableId],
    );
    return parseInt(result.rows[0].count);
  }

  // 7. Update Status Only
  async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE tables SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return result.rows[0];
  }

  // 5. Update QR Token (Dùng cho cả Create và Regenerate)
  async updateQRToken(id, token) {
    const result = await db.query(
      "UPDATE tables SET qr_token = $1 WHERE id = $2 RETURNING *",
      [token, id],
    );
    return result.rows[0];
  }

  // 6. Find By ID (Dùng cho Regenerate)
  async findById(id) {
    const result = await db.query("SELECT * FROM tables WHERE id = $1", [id]);
    return result.rows[0];
  }

  // 8. Phân công bàn (Admin dùng)
  async assignTableToWaiter(waiterId, tableId) {
    // Dùng ON CONFLICT để nếu đã gán rồi thì thôi không lỗi
    const result = await db.query(
      `INSERT INTO table_assignments (waiter_id, table_id) VALUES ($1, $2) 
             ON CONFLICT DO NOTHING`,
      [waiterId, tableId],
    );
    return result.rows[0];
  }

  // 9. Lấy bàn theo Waiter ID
  async getByWaiterId(waiterId) {
    const result = await db.query(
      `SELECT t.* 
             FROM tables t
             JOIN table_assignments ta ON t.id = ta.table_id
             WHERE ta.waiter_id = $1
             ORDER BY t.table_number ASC`,
      [waiterId],
    );
    return result.rows;
  }

  // 10. Hủy phân công (Optional)
  async unassignTable(waiterId, tableId) {
    await db.query(
      `DELETE FROM table_assignments WHERE waiter_id = $1 AND table_id = $2`,
      [waiterId, tableId],
    );
  }

  async findByToken(qr_token) {
    const result = await db.query("SELECT * FROM tables WHERE qr_token = $1", [
      qr_token,
    ]);
    return result.rows[0];
  }

  async updateSession(tableId, sessionId) {
    const result = await db.query(
      `UPDATE tables SET current_session_id = $1 WHERE id = $2 RETURNING *`,
      [sessionId, tableId],
    );
    return result.rows[0];
  }

  async clearSession(tableId) {
    const result = await db.query(
      `UPDATE tables SET current_session_id = NULL WHERE id = $1 RETURNING *`,
      [tableId],
    );
    return result.rows[0];
  }
}

module.exports = new TableRepository();
