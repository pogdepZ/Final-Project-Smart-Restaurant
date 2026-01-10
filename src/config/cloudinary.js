// server/config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình nơi lưu trữ (Storage)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        // [Security] Safe storage path: Hardcode tên folder, không lấy từ req.body
        folder: 'smart-restaurant-menu', 
        
        // [Security] Validate Extension: Chỉ cho phép các đuôi này
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        
        // [Security] Randomized filenames: Tự tạo tên file ngẫu nhiên
        public_id: (req, file) => {
            // Tạo tên file: menu-item-<thời_gian>-<random_string>
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `menu-item-${uniqueSuffix}`;
        },

        // [Performance] Auto nén ảnh để load nhanh hơn (như đã bàn trước đó)
        transformation: [
            { width: 1000, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" }
        ]
    },
});

// 3. Bộ lọc file (File Filter) - Chốt chặn bảo mật đầu tiên
const fileFilter = (req, file, cb) => {
    // [Security] Validate MIME type: Kiểm tra xem file có đúng là ảnh không
    if (
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/webp'
    ) {
        // Chấp nhận file
        cb(null, true);
    } else {
        // Từ chối file (Tạo lỗi để Controller bắt được)
        cb(new Error('UNSUPPORTED_FILE_TYPE'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // [Security] Giới hạn file tối đa 5MB
    }
});

module.exports = upload;
