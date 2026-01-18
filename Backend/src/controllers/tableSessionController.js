const tableSessionService = require("../services/tableSessionService");

// Kiểm tra và tạo session khi quét QR
exports.checkAndCreateSession = async (req, res) => {
  try {
    const { tableCode } = req.params;
    const { userId } = req.body;

    const result = await tableSessionService.checkAndCreateSession(
      tableCode,
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error in checkAndCreateSession:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi server",
    });
  }
};

// Xác thực mã đặt bàn và kích hoạt session
exports.verifyBookingAndActivateSession = async (req, res) => {
  try {
    const { tableCode } = req.params;
    const { bookingCode, userId } = req.body;

    const result = await tableSessionService.verifyBookingAndActivateSession(
      tableCode,
      bookingCode,
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error in verifyBookingAndActivateSession:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi server",
    });
  }
};

// Kết thúc session
exports.endSession = async (req, res) => {
  try {
    const { tableCode } = req.params;
    const { sessionId } = req.body;

    const result = await tableSessionService.endSession(tableCode, sessionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error in endSession:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi server",
    });
  }
};

// Validate session token
exports.validateSession = async (req, res) => {
  try {
    const { tableCode, sessionToken } = req.query;

    if (!tableCode || !sessionToken) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tableCode hoặc sessionToken",
      });
    }

    const result = await tableSessionService.validateSession(
      tableCode,
      sessionToken
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error in validateSession:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Lỗi server",
    });
  }
};