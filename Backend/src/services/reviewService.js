const repo = require('../repositories/reviewRepository');

exports.getItemReviews = async (menuItemId, page, limit) => {
  return repo.findReviewsByMenuItemId(menuItemId, page, limit);
};

exports.createReview = async (userId, payload) => {
  const { menuItemId, rating, comment } = payload;

  // 1. Kiểm tra Business Logic: User đã mua món này chưa?
  // Repo cần query bảng Orders/OrderItems

  console.log('Checking if user has purchased the item:', userId, menuItemId);

  const hasPurchased = await repo.checkUserPurchasedItem(userId, menuItemId);
  
  if(!userId) {
    const err = new Error('Bạn cần đăng nhập để đánh giá món ăn');
    err.status = 401;
    throw err;
  }

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