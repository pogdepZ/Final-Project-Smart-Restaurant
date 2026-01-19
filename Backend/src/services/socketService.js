// src/services/socketService.js

class SocketService {
  constructor() {
    this.io = null; // Biến lưu trữ instance của Socket.IO
  }

  // Hàm này được gọi 1 lần duy nhất ở server.js
  init(io) {
    this.io = io;
    console.log("✅ SocketService initialized!");

    this.io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Admin join phòng admin để nhận thông báo
      socket.on("join_admin", () => {
        socket.join("admin_room");
        console.log(`🛡️ Socket ${socket.id} joined admin_room`);
      });

      // Waiter join phòng staff
      socket.on("join_waiter", () => {
        socket.join("waiter_room");
        console.log(`👩‍🍳 Socket ${socket.id} joined waiter_room`);
      });

      // kitchen join phòng
      socket.on("join_kitchen", () => {
        socket.join("kitchen_room");
        // console.log(`Socket ${socket.id} joined kitchen_room`);
      });

      // Khách hàng join phòng bàn ăn (từ query tableToken)
      socket.on("join_table", (data) => {
        // console.log("🔑 join_table data:", data);
        const tableCode = data.tableCode || socket.handshake.query.tableCode;
        if (tableCode) {
          socket.join(`table_${tableCode}`);
          console.log(`✅ Socket ${socket.id} joined table_${tableCode}`);
        }
      });
    });
  }

  // --- CÁC HÀM GỌI TỪ SERVICE KHÁC ---

  // 1. Thông báo đơn mới
  notifyNewOrder(order) {
    if (!this.io) {
      console.warn("⚠️ SocketIO chưa được khởi tạo!");
      return;
    }
    // Gửi cho kitchen
    this.io.to("waiter_room").emit("new_order", order);

    // Gửi thêm cho admin room để admin nhận thông báo
    this.io.to("admin_room").emit("admin_new_order", {
      type: "new_order",
      order: order,
      message: `Đơn hàng mới từ Bàn ${order.table_number || order.table_id}`,
      timestamp: new Date().toISOString(),
    });
    console.log("📡 Đã thông báo đơn mới cho admin & kitchen:", order.id);
  }

  // 2. Thông báo cập nhật đơn hàng (Status thay đổi)

  notifyToKitchen(order) {
    if (!this.io) return;
    this.io.to("kitchen_room").emit("update_order", order);
  }

  notifyOrderUpdate(order, destination = "ALL") {
    if (!this.io) return;

    if (destination === "KITCHEN") {
      this.io.to("kitchen_room").emit("update_order", order);
      console.log("📡 Bắn socket cập nhật đơn cho kitchen:", order.id);
      return;
    }

    // khi cập nhật order luôn gửi cho admin và khách
    this.io.to("admin_room").emit("admin_order_update", {
      type: "order_update",
      order: order,
      message: `Đơn #${order.id} - ${this._getStatusMessage(order.status)}`,
      timestamp: new Date().toISOString(),
    });

    this.io.to(`table_${order.table_id}`).emit("order_status_update", {
      orderId: order.id,
      status: order.status,
      message: this._getStatusMessage(order.status),
      timestamp: new Date().toISOString(),
    });

    console.log(
      "📡 Bắn socket cập nhật đơn:",
      order.id,
      "Status:",
      order.status,
      "table:",
      order.table_id,
    );
  }

  // Thông báo cập nhật từng item trong đơn
  notifyOrderItemUpdate(orderId, itemId, itemStatus, tableId) {
    if (!this.io) return;

    console.log(
      `📡 Bắn socket item update: Order ${orderId}, Item ${itemId} -> ${itemStatus}`,
    );

    // bắn cho admin
    this.io.to("admin_room").emit("admin_order_item_update", {
      orderId,
      itemId,
      itemStatus,
      timestamp: new Date().toISOString(),
    });

    // bắn cho waiter
    this.io.to("waiter_room").emit("order_item_status_update", {
      orderId,
      itemId,
      itemStatus,
      timestamp: new Date().toISOString(),
    });

    // Bắn cho khách ở bàn đó
    if (tableId) {
      this.io.to(`table_${tableId}`).emit("order_item_status_update", {
        orderId,
        itemId,
        itemStatus,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Thông báo có yêu cầu thanh toán mới
  notifyBillRequest(data) {
    if (this.io) {
      // Gửi cho tất cả staff (waiter, cashier, admin)
      this.io.to("waiter_room").emit("bill_request", data);
      // Gửi cho admin room để admin nhận thông báo
      this.io.to("admin_room").emit("bill_request", data);
      console.log(
        "📢 Bill request notification sent:",
        data.request?.table_number,
      );
    }
  }

  // Thông báo cập nhật trạng thái yêu cầu
  notifyBillRequestUpdate(data) {
    if (this.io) {
      // Gửi cho staff
      this.io.to("staff").emit("bill_request_update", data);
      // Gửi cho bàn cụ thể (nếu khách đang xem)
      this.io.to(`table_${data.tableId}`).emit("bill_request_update", data);
    }
  }

  // Helper: Tạo message dễ hiểu cho khách
  _getStatusMessage(status) {
    const messages = {
      received: "📝 Đơn đã được tiếp nhận",
      preparing: "🔥 Bếp đang chuẩn bị",
      ready: "✅ Đơn đã sẵn sàng!",
      completed: "💰 Thanh toán hoàn tất",
      rejected: "❌ Đơn đã bị hủy",
    };
    return messages[status] || "📦 Cập nhật đơn hàng";
  }

  // --- BỔ SUNG HÀM NÀY ĐỂ SỬA LỖI ---
  // Chấp nhận cả 2 cách gọi: notifyTableUpdate(tableData) hoặc notifyTableUpdate(io, tableData)
  notifyTableUpdate(arg1, arg2) {
    if (!this.io) return;

    // Xác định tableData - hỗ trợ cả 2 cách gọi cũ và mới
    let tableData;
    if (arg2 !== undefined) {
      // Gọi theo kiểu cũ: notifyTableUpdate(io, { type, table })
      tableData = arg2;
    } else {
      // Gọi theo kiểu mới: notifyTableUpdate({ type, table }) hoặc notifyTableUpdate(table)
      tableData = arg1;
    }

    // Nếu tableData có dạng { type, table }, lấy table ra
    const table = tableData.table || tableData;
    const type = tableData.type || "update";

    console.log(
      "📡 Bắn socket update bàn:",
      table.table_number || table.id,
      "- Type:",
      type,
    );

    // Gửi cho Admin/Waiter (đang ở trong admin_room hoặc kitchen_room)
    if (table.id) {
      this.io.to(`table_${table.id}`).emit("bill_update", {
        message: this._getStatusMessage("completed"),
        timestamp: new Date().toISOString(),
      });
    }

    this.io
      .to("admin_room")
      .to("kitchen_room")
      .emit("table_update", { type, table });

    // Gửi thông báo riêng cho admin về cập nhật bàn
    this.io.to("admin_room").emit("admin_table_update", {
      type: "table_update",
      table: table,
      message: `Bàn ${table.table_number || table.id} đã được cập nhật`,
      timestamp: new Date().toISOString(),
    });
  }

  // Thông báo khi có session mới (khách quét QR vào bàn)
  notifyTableSessionUpdate(data) {
    if (!this.io) return;
    console.log("SocketService: notifyTableSessionUpdate", data);

    const { table, session, type } = data;
    console.log(
      "📡 Bắn socket table session:",
      table?.table_number,
      "- Type:",
      type,
    );

    // Gửi cho admin room để cập nhật TableManagement
    this.io.to("admin_room").to("kitchen_room").emit("table_session_update", {
      type: type, // 'session_started' hoặc 'session_ended'
      table: table,
      session: session,
      timestamp: new Date().toISOString(),
    });

    // Cũng emit table_update để cập nhật trạng thái bàn
    this.io.to("admin_room").to("kitchen_room").emit("table_update", {
      type: "update",
      table: table,
    });

    // Gửi thông báo cho admin
    this.io.to("admin_room").emit("admin_table_update", {
      type: "table_session",
      table: table,
      message:
        type === "session_started"
          ? `🟢 Bàn ${table.table_number} có khách mới!`
          : `⚪ Bàn ${table.table_number} đã trống`,
      timestamp: new Date().toISOString(),
    });
  }

  // Thông báo thanh toán thành công cho admin
  notifyPaymentCompleted(data) {
    if (!this.io) return;

    const { table_id, table_number, bill, orders_count, total_amount } = data;

    console.log(
      "📡 Bắn socket thanh toán thành công - Bàn:",
      table_number,
      "- Tổng tiền:",
      total_amount,
    );

    // Gửi cho admin room
    this.io.to("admin_room").emit("admin_payment_completed", {
      type: "payment_completed",
      table_id: table_id,
      table_number: table_number,
      bill: bill,
      orders_count: orders_count,
      total_amount: total_amount,
      message: `💰 Bàn ${table_number} đã thanh toán ${total_amount?.toLocaleString("vi-VN")}₫`,
      timestamp: new Date().toISOString(),
    });

    // Cũng gửi cho kitchen room để waiter biết
    this.io.to("kitchen_room").emit("payment_completed", {
      table_id: table_id,
      table_number: table_number,
      total_amount: total_amount,
      timestamp: new Date().toISOString(),
    });
  }
}

// Xuất ra một instance duy nhất (Singleton)
module.exports = new SocketService();
