// src/services/authService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepo = require("../repositories/authRepository");

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

  const userRole = role || "waiter";
  const user = await authRepo.createUser({
    name,
    email,
    hashedPassword,
    role: userRole,
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

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Sai mật khẩu");
    err.status = 401;
    throw err;
  }

  // Access token ngắn hạn
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  // Refresh token dài hạn
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );

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
