// src/services/authService.js
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepo = require("../repositories/authRepository");
const config = require("../config");
const { hashToken } = require("../utils/token");
const passwordResetRepo = require("../repositories/passwordResetRepository");
const { sendResetPasswordEmail } = require("../utils/mailer");
const refreshTokenRepo = require("../repositories/refreshTokenRepository");
const { sendVerifyEmail } = require("../utils/mailer");
const crypto = require("crypto");
const emailVerifyRepo = require("../repositories/emailVerifyRepository");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async ({ credential }) => {
  if (!credential) {
    const err = new Error("Thiếu Google credential");
    err.status = 400;
    throw err;
  }

  // ✅ Verify Google ID token ở backend (chuẩn của Google)
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload(); // chứa email, name, picture,...

  const email = String(payload.email || "").toLowerCase();
  const name = payload.name || "Google User";

  if (!email) {
    const err = new Error("Google token không có email");
    err.status = 400;
    throw err;
  }

  // 1) tìm user theo email
  let user = await authRepo.findUserPublicByEmail(email);

  console.log('Google login user found:', user);

  // 2) chưa có thì tạo user mới (role customer)
  if (!user) {
    // bạn có thể tạo thêm cột is_verified = true vì email Google verified
    user = await authRepo.createUser({
      name,
      email,
      hashedPassword: "GOOGLE_OAUTH", // hoặc cho null nếu DB cho phép
      role: "customer",
    });
    // nếu DB có is_verified: bạn nên set true (cần repo update)
  }

  // 3) phát JWT giống login thường
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    config.auth.accessTokenSecret,
    { expiresIn: "10s" }
  );

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
    user: { id: user.id, name: user.name, role: user.role, email: user.email, avatar_url: user.avatar_url},
  };
};

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

  const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
  console.log('Base URL for email verification:', baseUrl);
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
    { expiresIn: "30m" }
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
      avatar_url: user.avatar_url,
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
        avatar_url: user.avatar_url,
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

exports.forgotPassword = async ({ email }) => {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return;

  // tìm user public để lấy id/name/email
  const user = await authRepo.findUserPublicByEmail(cleanEmail);

  // ✅ Không tiết lộ tồn tại hay không
  if (!user) return;

  // revoke token cũ (optional nhưng tốt)
  await passwordResetRepo.revokeAllByUserId(user.id); 

  // raw token gửi cho user qua email
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
  await passwordResetRepo.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  await sendResetPasswordEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });
};

exports.resetPassword = async ({ token, newPassword }) => {
  const rawToken = String(token || "").trim();
  const pw = String(newPassword || "");

  if (!rawToken) {
    const err = new Error("Thiếu token đặt lại mật khẩu");
    err.status = 400;
    throw err;
  }
  if (!pw || pw.length < 6) {
    const err = new Error("Mật khẩu tối thiểu 6 ký tự");
    err.status = 400;
    throw err;
  }

  const tokenHash = hashToken(rawToken);
  const stored = await passwordResetRepo.findValid(tokenHash);

  if (!stored) {
    const err = new Error("Link không hợp lệ hoặc đã hết hạn");
    err.status = 400;
    throw err;
  }

  // hash mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(pw, salt);

  await authRepo.updatePasswordById(stored.user_id, hashedPassword);
  await passwordResetRepo.markUsed(stored.id);

  // ✅ option bảo mật: revoke refresh tokens của user sau khi đổi pass
  // await refreshTokenRepo.revokeAllByUserId(stored.user_id);
};