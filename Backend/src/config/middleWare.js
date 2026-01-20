const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const cookieParser = require("cookie-parser");


const allowedOrigins = [
  "https://final-project-smart-restaurant.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const setUpMiddleWare = (app) => {
   app.use(
  cors({
    origin: (origin, cb) => {
      // cho phép Postman/cURL (origin = undefined)
      if (!origin) return cb(null, true);

      // allow exact matches
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // allow vercel preview domains
      if (origin.endsWith(".vercel.app")) return cb(null, true);

      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
    app.use(express.json()); // Đọc dữ liệu JSON gửi lên
    app.use(morgan('dev')); // Log request
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true })); // Giúp hiểu Form data (nếu cần)
}

module.exports = setUpMiddleWare;