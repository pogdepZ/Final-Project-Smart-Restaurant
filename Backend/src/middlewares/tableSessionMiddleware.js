const tableSessionService = require("../services/tableSessionService");

// Middleware kiểm tra session token hợp lệ
exports.requireTableSession = async (req, res, next) => {
  try {
    const sessionToken =
      req.headers["x-session-token"] ||
      req.body.sessionToken ||
      req.query.sessionToken;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng quét mã QR để truy cập",
        code: "SESSION_REQUIRED",
      });
    }

    const result = await tableSessionService.validateSession(sessionToken);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        message: result.message || "Phiên làm việc không hợp lệ",
        code: "SESSION_INVALID",
      });
    }

    // Attach session info vào request
    req.tableSession = result.session;
    next();
  } catch (err) {
    console.error("tableSessionMiddleware error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực phiên làm việc",
    });
  }
};

// Middleware optional - không bắt buộc có session
exports.optionalTableSession = async (req, res, next) => {
  try {
    const sessionToken =
      req.headers["x-session-token"] ||
      req.body.sessionToken ||
      req.query.sessionToken;

    if (sessionToken) {
      const result = await tableSessionService.validateSession(sessionToken);
      if (result.valid) {
        req.tableSession = result.session;
      }
    }

    next();
  } catch (err) {
    // Không block request nếu validate fail
    next();
  }
};
