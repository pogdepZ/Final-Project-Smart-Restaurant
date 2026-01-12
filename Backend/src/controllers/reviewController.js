const reviewService = require('../services/reviewService'); 

// API: Xem danh sách đánh giá của một món (Có phân trang)
exports.getItemReviews = async (req, res) => {
  // req.params.id: ID món ăn
  // req.query: Chứa page, limit, sortBy
  const data = await reviewService.getItemReviews(req.params.id, req.query);
  res.json(data);
};

// API: Thêm đánh giá mới (Cần check đã mua hàng chưa bên Service)
exports.createReview = async (req, res) => {
  // req.user.id: Lấy từ Auth Middleware (người đang đăng nhập)
  // req.body: Chứa { menuItemId, rating, comment }
  const data = await reviewService.createReview(req.user.id, req.body);
  
  // Trả về 201 Created
  res.status(201).json(data);
};