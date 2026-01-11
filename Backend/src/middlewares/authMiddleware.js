const passport = require("passport");

// Bắt buộc có token hợp lệ
exports.protect = passport.authenticate("jwt", { session: false });

// Check role admin (tuỳ bạn role là 'ADMIN' hay 'admin')
exports.adminOnly = (req, res, next) => {
  const role = req.user?.role || req.user?.roleId; // tuỳ payload của bạn
  if (role === "ADMIN" || role === "admin") return next();
  return res.status(403).json({ message: "Chỉ Admin mới được phép" });
};
