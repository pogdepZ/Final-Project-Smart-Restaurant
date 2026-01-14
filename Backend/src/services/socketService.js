// src/services/socketService.js

class SocketService {
    constructor() {
        this.io = null; // Biến lưu trữ instance của Socket.IO
    }

    // Hàm này được gọi 1 lần duy nhất ở server.js
    init(io) {
        this.io = io;
        console.log("✅ SocketService initialized!");

        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Waiter & Kitchen join phòng chung
            socket.on('join_kitchen', () => {
                socket.join('kitchen_room');
                // console.log(`Socket ${socket.id} joined kitchen_room`);
            });

            // Khách hàng join phòng bàn ăn
            socket.on('join_table', (tableId) => {
                socket.join(`table_${tableId}`);
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
        this.io.to('kitchen_room').emit('new_order', order);
    }

    // 2. Thông báo cập nhật đơn hàng (Status thay đổi)
    notifyOrderUpdate(order) {
        if (!this.io) return;

        // Báo cho bếp/waiter
        this.io.to('kitchen_room').emit('update_order', order);

        // Báo cho khách ngồi bàn đó (nếu có table_id)
        if (order.table_id) {
            this.io.to(`table_${order.table_id}`).emit('order_status_update', {
                orderId: order.id,
                status: order.status
            });
        }
    }

     // --- BỔ SUNG HÀM NÀY ĐỂ SỬA LỖI ---
    notifyTableUpdate(table) {
        if (!this.io) return;
        
        console.log("📡 Bắn socket update bàn:", table);
        
        // Gửi cho Admin/Waiter (đang ở trong admin_room hoặc kitchen_room)
        // để họ biết bàn này đã thanh toán xong
        this.io.to('admin_room').to('kitchen_room').emit('table_update', table);
    }
}

// Xuất ra một instance duy nhất (Singleton)
module.exports = new SocketService();