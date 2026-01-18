const billRequestService = require("../services/billRequestService");

// Khách gửi yêu cầu thanh toán
exports.requestBill = async (req, res) => {
  try {
    const { tableId, sessionId, note } = req.body;

    if (!tableId) {
      return res.status(400).json({ message: "Thiếu thông tin bàn" });
    }

    const result = await billRequestService.requestBill({
      tableId,
      sessionId,
      note,
    }, req.io);

    res.json(result);
  } catch (err) {
    console.error("Request bill error:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

// Waiter xác nhận đã nhận yêu cầu
exports.acknowledgeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await billRequestService.acknowledgeRequest(id, userId);
    res.json({ success: true, request: result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// Lấy danh sách yêu cầu pending (cho Waiter)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await billRequestService.getPendingRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Kiểm tra trạng thái yêu cầu của bàn
exports.getRequestStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const result = await billRequestService.getRequestStatus(tableId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Hủy yêu cầu
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await billRequestService.cancelRequest(id, "cancelled");
    res.json({ success: true, request: result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
