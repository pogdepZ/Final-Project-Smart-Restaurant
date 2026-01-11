const dotenv = require('dotenv');
const { access } = require('fs');
const path = require('path');

// Tải biến môi trường từ file .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Cấu hình Database
  db: {
    url: process.env.DATABASE_URL,
  },

  // Cấu hình Bảo mật/JWT
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    saltRounds: 10,
  },

  // Cấu hình Frontend (Dùng cho CORS)
  frontendUrl: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Cấu hình Upload ảnh
  upload: {
    path: path.join(__dirname, '../../public/uploads'),
    maxSize: 5 * 1024 * 1024, // 5MB
  }
};

// Kiểm tra xem các biến quan trọng có bị thiếu không
if (!config.db.url) {
  throw new Error('LỖI: DATABASE_URL không tồn tại trong file .env');
}

module.exports = config;