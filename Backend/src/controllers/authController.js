// src/controllers/authController.js

const authService = require("../services/authService");

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({
      message: "Đăng ký thành công",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || "Lỗi Server" });
  }
};

exports.login = async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Đăng nhập thành công",
      accessToken: accessToken,
      user,
    });

    
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || "Lỗi Server" });
  }
};
