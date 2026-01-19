const reviewService = require('../services/reviewService');

// API: Xem danh sách đánh giá của một món (Có phân trang)
exports.getItemReviews = async (req, res) => {
  try {
    const { id } = req.params; // menu item id
    const { page = 1, limit = 5 } = req.query;

    const result = await reviewService.getItemReviews(id, page, limit);
    return res.json(result); // { data, meta }
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

// API: Thêm đánh giá mới (Cần check đã mua hàng chưa bên Service)
exports.createReview = async (req, res) => {
  // req.user.id: Lấy từ Auth Middleware (người đang đăng nhập)
  // req.body: Chứa { menuItemId, rating, comment }
  try {
    const userId = req.user.id;
    const payload = req.body;
    console.log('Creating review for userId:', userId, 'with payload:', payload);

    const newReview = await reviewService.createReview(userId, payload);
    return res.status(201).json({
      message: "Đánh giá món ăn thành công",
      review: newReview
    });
  }
  catch (e) {
    return res.status(e.status || 500).json({ message: e.message || "Lỗi Server" });
  }
};