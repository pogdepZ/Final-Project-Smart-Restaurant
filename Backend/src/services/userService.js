const bcrypt = require("bcryptjs");
const userRepo = require("../repositories/usersRepository");
const authRepo = require("../repositories/authRepository");

// GET profile
exports.getMe = async (userId) => {
  const user = await userRepo.findPublicById(userId);
  if (!user) {
    const err = new Error("User không tồn tại");
    err.status = 404;
    throw err;
  }
  return user;
};

// UPDATE profile (name + preferences)
exports.updateMe = async (userId, { name, preferences }) => {
  const cleanName = String(name || "").trim();
  const cleanPref =
    typeof preferences === "undefined"
      ? undefined
      : String(preferences || "").trim();

  if (!cleanName || cleanName.length < 2) {
    const err = new Error("Tên không hợp lệ (tối thiểu 2 ký tự)");
    err.status = 400;
    throw err;
  }

  if (typeof cleanPref !== "undefined" && cleanPref.length > 255) {
    const err = new Error("Sở thích tối đa 255 ký tự");
    err.status = 400;
    throw err;
  }

  return await userRepo.updateProfile(userId, {
    name: cleanName,
    preferences: typeof cleanPref === "undefined" ? null : cleanPref,
  });
};

// UPDATE avatar (Cloudinary URL)
exports.updateAvatar = async (userId, avatarUrl) => {
  if (!avatarUrl) {
    const err = new Error("Avatar không hợp lệ");
    err.status = 400;
    throw err;
  }

  return await userRepo.updateAvatar(userId, avatarUrl);
};

// CHANGE password
exports.changePassword = async (userId, { currentPassword, newPassword }) => {
  const cur = String(currentPassword || "");
  const next = String(newPassword || "");

  // ✅ validate input (BE)
  if (!cur) {
    const err = new Error("Vui lòng nhập mật khẩu cũ");
    err.status = 400;
    throw err;
  }

  if (!next || next.length < 6) {
    const err = new Error("Mật khẩu mới tối thiểu 8 ký tự");
    err.status = 400;
    throw err;
  }

  // optional: chặn user nhập mật khẩu mới trùng mật khẩu cũ
  if (cur === next) {
    const err = new Error("Mật khẩu mới phải khác mật khẩu cũ");
    err.status = 400;
    throw err;
  }

  const user = await userRepo.findWithPasswordById(userId);
  if (!user) {
    const err = new Error("User không tồn tại");
    err.status = 404;
    throw err;
  }

  const ok = await bcrypt.compare(cur, user.password);
  if (!ok) {
    const err = new Error("Mật khẩu cũ không đúng");
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(next, salt);

  await authRepo.updatePasswordById(userId, hashed);

  return true;
};