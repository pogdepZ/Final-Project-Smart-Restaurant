const jwt = require("jsonwebtoken");

// Middleware kiểm tra Token
exports.protect = (req, res, next) => {
  let token;

  // 1. Lấy token từ header (Authorization: Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("hello");

      // 2. Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // 3. Lưu thông tin user vào req để dùng ở bước sau
      req.user = decoded;

      return next(); // Cho phép đi tiếp
    } catch (error) {
      console.error(error);
      res
        .status(401)
        .json({ message: "Token không hợp lệ, vui lòng đăng nhập lại" });
    }
  }

  if (!token) {
    res
      .status(401)
      .json({ message: "Bạn chưa đăng nhập, không có quyền truy cập" });
  }
};

// Middleware kiểm tra quyền Admin
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Chỉ Admin mới có quyền thực hiện thao tác này" });
  }
};
