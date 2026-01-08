const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Multer Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'smart-restaurant', // Tên thư mục trên Cloud
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Validate định dạng
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // Resize tự động
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Validate Size: Max 5MB
});

module.exports = upload;