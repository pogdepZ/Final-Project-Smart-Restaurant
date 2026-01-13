// src/services/authService.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepo = require("../repositories/authRepository");
const config = require("../config");
const { hashToken } = require("../utils/token");

const refreshTokenRepo = require("../repositories/refreshTokenRepository");
const { sendVerifyEmail } = require("../utils/mailer");
const crypto = require("crypto");
const emailVerifyRepo = require("../repositories/emailVerifyRepository");


exports.register = async ({ name, email, password, role }) => {
  // Input validation (backend)
  if (!name || !email || !password) {
    const err = new Error("Vui lòng nhập đầy đủ tên, email và mật khẩu");
    err.status = 400;
    throw err;
  }
  const existed = await authRepo.findUserPublicByEmail(email);
  if (existed) {
    const err = new Error("Email này đã được sử dụng");
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userRole = role || "customer";
  const user = await authRepo.createUser({
    name,
    email,
    hashedPassword,
    role: userRole,
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken); // bạn đã có hashToken dùng cho refresh token

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

  await emailVerifyRepo.upsertToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  await sendVerifyEmail({
    to: user.email,
    name: user.name,
    verifyUrl,
  });

  return user; // {id,name,email,role}
};

exports.login = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error("Vui lòng nhập email và mật khẩu");
    err.status = 400;
    throw err;
  }

  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    const err = new Error("Tài khoản không tồn tại");
    err.status = 401;
    throw err;
  }

  if (!user.is_verified) {
    const err = new Error("Vui lòng xác thực email trước khi đăng nhập");
    err.status = 403;
    throw err;
  }


  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Sai mật khẩu");
    err.status = 401;
    throw err;
  }

  // Access token ngắn hạn
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    config.auth.accessTokenSecret,
    { expiresIn: "5m" }
  );

  // Refresh token dài hạn
  const refreshToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    config.auth.refreshTokenSecret,
    { expiresIn: "30d" }
  );

  const refreshTokenHash = hashToken(refreshToken);

  await refreshTokenRepo.create({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
    },
  };
};

exports.refreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.auth.refreshTokenSecret);

    const tokenHash = hashToken(refreshToken);
    const storedToken = await refreshTokenRepo.findValid(tokenHash);
    if (!storedToken) {
      const err = new Error("Refresh token không hợp lệ");
      err.status = 401;
      throw err;
    }

    // 👉 LẤY USER TỪ DB
    const user = await authRepo.findUserById(decoded.id);
    if (!user) {
      const err = new Error("User không tồn tại");
      err.status = 401;
      throw err;
    }

    // revoke token cũ
    await refreshTokenRepo.revokeById(storedToken.id);

    // tạo token mới
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      config.auth.accessTokenSecret,
      { expiresIn: "5m" }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      config.auth.refreshTokenSecret,
      { expiresIn: "30d" }
    );

    const newHash = hashToken(newRefreshToken);
    await refreshTokenRepo.create({
      userId: user.id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // ✅ TRẢ CẢ USER
    return {
      accessToken: newAccessToken,
      newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    };
  } catch (e) {
    const err = new Error(
      e.name === "TokenExpiredError"
        ? "Refresh token đã hết hạn"
        : "Refresh token không hợp lệ"
    );
    err.status = 401;
    throw err;
  }
};


exports.verifyEmail = async ({ email, token }) => {
  if (!email || !token) {
    const err = new Error("Thiếu email hoặc token");
    err.status = 400;
    throw err;
  }

  const user = await authRepo.findUserByEmail(email.toLowerCase().trim());
  if (!user) {
    const err = new Error("User không tồn tại");
    err.status = 404;
    throw err;
  }

  // đã verify thì ok luôn
  if (user.is_verified) {
    return { alreadyVerified: true };
  }

  const tokenHash = hashToken(String(token));
  const stored = await emailVerifyRepo.findValidByHash(tokenHash);
  if (!stored || stored.user_id !== user.id) {
    const err = new Error("Link xác thực không hợp lệ hoặc đã hết hạn");
    err.status = 400;
    throw err;
  }

  await authRepo.markUserVerified(user.id); // sẽ tạo function này
  await emailVerifyRepo.deleteById(stored.id);

  return { verified: true };
};

exports.resendVerifyEmail = async ({ email }) => {
  const e = String(email || "").trim().toLowerCase();
  if (!e) {
    const err = new Error("Vui lòng nhập email");
    err.status = 400;
    throw err;
  }

  const user = await authRepo.findUserByEmail(e);
  if (!user) {
    const err = new Error("Tài khoản không tồn tại");
    err.status = 404;
    throw err;
  }

  if (user.is_verified) return { alreadyVerified: true };

  const crypto = require("crypto");
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await emailVerifyRepo.upsertToken({ userId: user.id, tokenHash, expiresAt });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(e)}`;

  await sendVerifyEmail({ to: e, name: user.name, verifyUrl });
  return { sent: true };
};

