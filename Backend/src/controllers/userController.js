const userService = require("../services/userService");

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await userService.getMe(req.user.id);
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({
      message: err.message || "Lỗi Server",
    });
  }
};

// PUT /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    return res.json({
      message: "Cập nhật hồ sơ thành công",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 400).json({
      message: err.message || "Cập nhật thất bại",
    });
  }
};

// POST /api/users/me/avatar
exports.uploadMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh" });
    }

    // ✅ Cloudinary trả secure_url
    const avatarUrl = req.file.path || req.file.secure_url;

    const user = await userService.updateAvatar(req.user.id, avatarUrl);

    return res.json({
      message: "Cập nhật avatar thành công",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 400).json({
      message: err.message || "Upload avatar thất bại",
    });
  }
};

// POST /api/users/me/change-password
exports.changePassword = async (req, res) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 400).json({
      message: err.message || "Đổi mật khẩu thất bại",
    });
  }
};
