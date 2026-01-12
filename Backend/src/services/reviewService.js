const repo = require('../repositories/reviewRepository');

exports.getItemReviews = async (menuItemId, query) => {
  // Xử lý phân trang mặc định
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 5;
  const offset = (page - 1) * limit;

  // Gọi repo lấy danh sách và tổng số lượng để tính phân trang
  const reviews = await repo.findReviewsByMenuItemId(menuItemId, limit, offset);
  const total = await repo.countReviewsByMenuItemId(menuItemId);

  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit)
    }
  };
};

exports.createReview = async (userId, payload) => {
  const { menuItemId, rating, comment } = payload;

  // 1. Kiểm tra Business Logic: User đã mua món này chưa?
  // Repo cần query bảng Orders/OrderItems
  const hasPurchased = await repo.checkUserPurchasedItem(userId, menuItemId);
  
  if (!hasPurchased) {
    const err = new Error('Bạn cần đặt món này thành công trước khi đánh giá');
    err.status = 403; // Forbidden
    throw err;
  }

  // 2. Kiểm tra xem đã đánh giá chưa (tránh spam - tuỳ chọn)
  const existingReview = await repo.findReviewByUserAndItem(userId, menuItemId);
  if (existingReview) {
    const err = new Error('Bạn đã đánh giá món này rồi');
    err.status = 409; // Conflict
    throw err;
  }

  // 3. Tạo đánh giá mới
  const newReview = await repo.insertReview({
    user_id: userId,
    menu_item_id: menuItemId,
    rating,
    comment,
    created_at: new Date()
  });

  return newReview;
};