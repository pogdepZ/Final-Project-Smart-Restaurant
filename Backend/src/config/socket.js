const { Server } = require('socket.io');
const socketService = require('../services/socketService'); // Import Service

const setUpSocket = (server, app) => {
    // 1. Khởi tạo IO
    const io = new Server(server, {
        cors: {
            origin: [
                "https://final-project-smart-restaurant.vercel.app",
                "http://localhost:5173",
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // 2. Inject IO vào Request (để Controller dùng nếu cần gấp)
    app.use((req, res, next) => {
        req.io = io;
        next();
    });

    // 3. Kích hoạt logic lắng nghe từ Service (QUAN TRỌNG)
    socketService.init(io);

    return io;
}

module.exports = setUpSocket;