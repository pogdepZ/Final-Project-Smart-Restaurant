const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const cookieParser = require("cookie-parser");

const setUpMiddleWare = (app) => {
    app.use(cors({
        origin: "http://localhost:5173", // frontend url
        credentials: true
    }));
    app.use(express.json()); // Đọc dữ liệu JSON gửi lên
    app.use(morgan('dev')); // Log request
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true })); // Giúp hiểu Form data (nếu cần)
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
}

module.exports = setUpMiddleWare;