const { Server } = require('socket.io');

const setUpSocket = (server, app) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Cho phép Frontend gọi vào (hoặc để "http://localhost:5173")
            methods: ["GET", "POST"]
        }
    });
    app.use((req, res, next) => {
        req.io = io;
        next();
    });

    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);
        // Khách hàng tham gia vào "room" riêng của bàn họ (để nhận thông báo riêng)
        // Ví dụ: socket.emit('join_table', 'table-uuid-123')
        socket.on('join_table', (tableId) => {
            socket.join(`table_${tableId}`);
            console.log(`Socket ${socket.id} joined table_${tableId}`);
        });

        // Nhân viên bếp/admin tham gia vào "room" nhận đơn (kênh chung)
        socket.on('join_kitchen', () => {
            socket.join('kitchen_room');
            console.log(`Socket ${socket.id} joined kitchen_room`);
        });

        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
        });
    });
}

module.exports = setUpSocket;