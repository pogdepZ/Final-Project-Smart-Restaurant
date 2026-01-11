const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Định nghĩa API

// Route Đăng nhập: POST /auth/login
router.post('/login', authController.login);

// Route Đăng ký: POST /auth/register
router.post('/register', authController.register);

// Route Refresh token: POST /auth/refresh
router.post('/refresh', authController.refreshToken);

module.exports = router;