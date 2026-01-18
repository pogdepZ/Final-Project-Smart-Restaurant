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
}

module.exports = setUpMiddleWare;