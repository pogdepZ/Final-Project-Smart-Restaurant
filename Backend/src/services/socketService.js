class SocketService {
    // Hàm khởi tạo lắng nghe sự kiện
    init(io) {
        io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // 1. Join Room: Bếp (Nhận đơn mới)
            socket.on('join_kitchen', () => {
                socket.join('kitchen_room');
                console.log(`👨‍🍳 Socket ${socket.id} joined KITCHEN`);
            });

            // 2. Join Room: Admin/Waiter (Nhận update bàn/menu) - MỚI
            socket.on('join_admin', () => {
                socket.join('admin_room');
                console.log(`🛡️ Socket ${socket.id} joined ADMIN`);
            });

            // 3. Join Room: Bàn cụ thể (Khách hàng)
            socket.on('join_table', (tableId) => {
                socket.join(`table_${tableId}`);
                console.log(`🍽️ Socket ${socket.id} joined TABLE ${tableId}`);
            });

            socket.on('disconnect', () => {
                console.log('❌ Client disconnected:', socket.id);
            });
        });
    }

    // --- CÁC HÀM TIỆN ÍCH ĐỂ GỌI TỪ SERVICE KHÁC ---

    // Gửi thông báo đơn hàng mới
    notifyNewOrder(io, order) {
        // Báo cho bếp và admin
        io.to('kitchen_room').to('admin_room').emit('new_order', order);
    }

    // Gửi thông báo cập nhật đơn hàng
    notifyOrderUpdate(io, order) {
        io.to('kitchen_room').to('admin_room').emit('update_order', order);
        if (order.table_id) {
            io.to(`table_${order.table_id}`).emit('order_status_update', {
                orderId: order.id,
                status: order.status
            });
        }
    }

    // Gửi thông báo cập nhật bàn (Đổi màu realtime)
    notifyTableUpdate(io, table) {
        io.to('admin_room').emit('table_update', table);
    }
}

module.exports = new SocketService();