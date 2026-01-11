require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');


// Route import
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const modifierRoutes = require('./routes/modifierRoutes')

const app = express();
const server = http.createServer(app); // Tạo HTTP Server từ Express App

// Cấu hình Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép Frontend gọi vào (hoặc để "http://localhost:5173")
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors()); // Cho phép Frontend react gọi vào
app.use(express.json()); // Đọc dữ liệu JSON gửi lên
app.use(morgan('dev')); // Log request
app.use(express.urlencoded({ extended: true })); // Giúp hiểu Form data (nếu cần)


// Lưu biến io vào req để dùng ở Controller
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu/modifiers', modifierRoutes);

// Xử lý kết nối Socket
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


const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
    // Lỗi do Multer ném ra
    if (err.message === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({ message: 'Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.' });
    }
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File quá lớn. Vui lòng upload ảnh dưới 5MB.' });
    }

    // Các lỗi khác
    console.error(err.stack);
    res.status(500).json({ message: 'Lỗi Server nội bộ' });
});

server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});