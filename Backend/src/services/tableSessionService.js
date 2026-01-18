const crypto = require("crypto");
const tableRepository = require("../repositories/tableRepository");
const tableSessionRepository = require("../repositories/tableSessionRepository");

class TableSessionService {
  // Sinh session token ngẫu nhiên
  generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  // Kiểm tra bàn và tạo/lấy session
  async checkAndCreateSession(tableCode, userId = null) {
    // 1. Tìm bàn theo table_number hoặc id
    let table = await tableRepository.findById(tableCode);

    if (!table) {
      const err = new Error("Bàn không tồn tại");
      err.status = 404;
      throw err;
    }

    console.log("Found table:", table);

    // 2. Kiểm tra bàn có active không
    if (table.status === "inactive") {
      const err = new Error("Bàn đang tạm ngưng phục vụ");
      err.status = 400;
      throw err;
    }

    // 3. Kiểm tra session hiện tại
    const existingSession = await tableSessionRepository.findActiveByTableId(
      table.id
    );

    if (existingSession) {
      // Session đã tồn tại, check xem userid đúng hay không
        console.log(existingSession.user_id, userId);

      if (
        userId &&
        existingSession.user_id &&
        userId !== existingSession.user_id
      ) {
        const err = new Error("Bàn đang được sử dụng bởi khách khác.");
        err.status = 400;
        throw err;
      }

      return {
        success: true,
        tableSession: {
          id: existingSession.id,
          sessionToken: existingSession.session_token,
          tableId: existingSession.table_id,
          tableNumber: table.table_number,
          startedAt: existingSession.started_at,
        },
        isExisting: true,
      };
    }

    // 4. Tạo session mới
    const sessionToken = this.generateSessionToken();
    const newSession = await tableSessionRepository.create({
      tableId: table.id,
      userId,
      sessionToken,
    });

    console.log("session token:", newSession);

    // 5. Cập nhật session cho bàn
    await tableRepository.updateSession(table.id, newSession.id);

    return {
      success: true,
      tableSession: {
        id: newSession.id,
        sessionToken: newSession.session_token,
        tableId: newSession.table_id,
        tableNumber: table.table_number,
        startedAt: newSession.started_at,
      },
      requiresBookingCode: false,
      isExisting: false,
    };
  }

  

  // Kết thúc session
  async endSession(tableCode, sessionId) {
    // 1. Tìm session
    const session = await tableSessionRepository.findById(sessionId);

    if (!session) {
      const err = new Error("Session không tồn tại");
      err.status = 404;
      throw err;
    }

    if (session.status === "closed") {
      return { message: "Session đã được đóng trước đó" };
    }

    // 2. Kết thúc session
    const endedSession = await tableSessionRepository.endSession(sessionId);

    // 3. Cập nhật trạng thái bàn về 'active' (available)
    await tableRepository.updateStatus(session.table_id, 'active');

    return {
      message: "Đã kết thúc session",
      session: endedSession,
    };
  }

  // Validate session token
  async validateSession(tableCode, sessionToken) {
    // 1. Tìm session theo token
    const session = await tableSessionRepository.findBySessionToken(
      sessionToken
    );

    if (!session) {
      return {
        valid: false,
        message: "Session không hợp lệ hoặc đã hết hạn",
      };
    }

    // 2. Kiểm tra bàn có khớp không
    let table = await tableRepository.findByNumber(tableCode);
    if (!table) {
      table = await tableRepository.findById(tableCode);
    }

    if (!table || session.table_id !== table.id) {
      return {
        valid: false,
        message: "Session không thuộc bàn này",
      };
    }

    return {
      valid: true,
      session: {
        id: session.id,
        tableId: session.table_id,
        tableNumber: session.table_number,
        startedAt: session.started_at,
      },
    };
  }
}

module.exports = new TableSessionService();
