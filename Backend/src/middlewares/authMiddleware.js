const passport = require("passport");

exports.protect = passport.authenticate("jwt", { session: false });

exports.adminOnly = (req, res, next) => {
  const role = req.user?.role;
  if (role === "ADMIN" || role === "admin") return next();
  return res.status(403).json({ message: "Chỉ Admin mới được phép" });
};

exports.staffOnly = (req, res, next) => {
  const role = req.user?.role;
  if (role !== "USER" && role !== "user") return next();
  return res.status(403).json({ message: "Chỉ nhân viên mới được phép" });
};
