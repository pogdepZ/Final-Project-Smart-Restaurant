// server/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình nơi lưu trữ (Storage)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'smart-restaurant-menu', // Tên thư mục trên Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Định dạng cho phép
        transformation: [{ width: 500, height: 500, crop: 'limit' }] // Tự động resize ảnh (tối ưu)
    },
});

const upload = multer({ storage: storage });

module.exports = upload;