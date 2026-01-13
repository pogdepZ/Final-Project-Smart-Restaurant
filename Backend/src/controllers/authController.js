// src/controllers/authController.js

const authService = require("../services/authService");
const authRepo = require("../repositories/authRepository");


exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({
      message: "Đăng ký thành công vui lòng vào email để xác thực tài khoản",
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


exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Không có refresh token" });
    }

    const { accessToken, newRefreshToken, user } =
      await authService.refreshToken(refreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Refresh token thành công",
      accessToken,
      user, 
    });
  } catch (err) {
    console.error(err);
    return res
      .status(err.status || 401)
      .json({ message: err.message || "Refresh token thất bại" });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.json({ exists: false });

    const existed = await authRepo.findUserPublicByEmail(email);
    return res.json({ exists: !!existed });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.body);
    return res.json({ message: "Xác thực email thành công", ...result });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || "Lỗi Server" });
  }
};

exports.resendVerifyEmail = async (req, res) => {
  try {
    const result = await authService.resendVerifyEmail(req.body);
    return res.json({ message: "Đã gửi lại email xác thực", ...result });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || "Lỗi Server" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // GIS trả về field "credential"
    const { accessToken, refreshToken, user } = await authService.googleLogin({ credential });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Đăng nhập Google thành công",
      accessToken,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || "Lỗi Server" });
  }
};

