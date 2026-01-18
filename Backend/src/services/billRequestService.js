const billRequestRepo = require("../repositories/billRequestRepository");
const tableRepository = require("../repositories/tableRepository");
const socketService = require("./socketService");

class BillRequestService {
  // Khách yêu cầu thanh toán
  async requestBill({ tableId, sessionId, note }, io) {
    // 1. Kiểm tra bàn tồn tại
    const table = await tableRepository.findById(tableId);
    if (!table) {
      const err = new Error("Bàn không tồn tại");
      err.status = 404;
      throw err;
    }

    // 2. Kiểm tra đã có yêu cầu pending chưa
    const existingRequest = await billRequestRepo.findPendingByTableId(tableId);
    if (existingRequest) {
      return {
        success: true,
        message: "Yêu cầu thanh toán đã được gửi trước đó",
        request: existingRequest,
        alreadyRequested: true,
      };
    }

    // 3. Tạo yêu cầu mới
    const newRequest = await billRequestRepo.create({
      tableId,
      sessionId,
      note,
    });

    // 4. Gửi thông báo realtime cho Waiter/Cashier
    socketService.notifyBillRequest({
      type: "new",
      request: {
        ...newRequest,
        table_number: table.table_number,
        location: table.location,
      },
    });

    return {
      success: true,
      message: "Đã gửi yêu cầu thanh toán. Nhân viên sẽ đến ngay!",
      request: newRequest,
      alreadyRequested: false,
    };
  }

  // Waiter xác nhận đã nhận yêu cầu
  async acknowledgeRequest(requestId, userId) {
    const request = await billRequestRepo.findById(requestId);
    if (!request) {
      const err = new Error("Không tìm thấy yêu cầu");
      err.status = 404;
      throw err;
    }

    if (request.status !== "pending") {
      const err = new Error("Yêu cầu đã được xử lý");
      err.status = 400;
      throw err;
    }

    const updated = await billRequestRepo.updateStatus(
      requestId,
      "acknowledged",
      userId
    );

    // Thông báo cho khách biết nhân viên đang đến
    socketService.notifyBillRequestUpdate({
      type: "acknowledged",
      tableId: request.table_id,
      request: updated,
    });

    return updated;
  }

  // Lấy danh sách yêu cầu pending
  async getPendingRequests() {
    return billRequestRepo.findAllPending();
  }

  // Hủy yêu cầu (khách hủy hoặc đã thanh toán xong)
  async cancelRequest(requestId, reason = "cancelled") {
    const updated = await billRequestRepo.updateStatus(requestId, reason);
    return updated;
  }

  // Kiểm tra trạng thái yêu cầu của bàn
  async getRequestStatus(tableId) {
    const request = await billRequestRepo.findPendingByTableId(tableId);
    return {
      hasPendingRequest: !!request,
      request,
    };
  }
}

module.exports = new BillRequestService();
