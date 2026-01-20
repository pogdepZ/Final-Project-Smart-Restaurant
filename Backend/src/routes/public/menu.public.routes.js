const express = require('express');
const router = express.Router();

// Import Controllers
const menuController = require('../../controllers/menuController');
const photoController = require('../../controllers/photoController');
const reviewController = require('../../controllers/reviewController'); // Mới: Xử lý đánh giá

// Import Middleware
const { protect} = require('../../middlewares/authMiddleware');

// ==========================================
// 1. NHÓM DANH MỤC (CATEGORIES)
// ==========================================
// Lấy danh sách danh mục để làm bộ lọc
router.get('/categories', menuController.getCategories);

// ==========================================
// 2. NHÓM MÓN ĂN (MENU ITEMS)
// ==========================================

// Lấy danh sách món (Bao gồm: Tìm kiếm, Lọc, Sắp xếp, Phân trang)
// Controller cần xử lý query params: ?search=...&categoryId=...&sortBy=...&page=...
router.get('/items', menuController.getMenuItemsPublic);

// Xem chi tiết một món ăn (Bao gồm cả trạng thái: Hết hàng/Còn hàng)
router.get('/items/:id', menuController.getMenuItemById);

// Hiển thị món liên quan (0.25 điểm) - Gợi ý món cùng loại hoặc hay mua kèm
router.get('/items/:id/related', menuController.getRelatedMenuItems);

// Xem ảnh món ăn (Gallery)
router.get('/items/:id/photos', photoController.getItemPhotos);

// ==========================================
// 3. NHÓM ĐÁNH GIÁ (REVIEWS)
// ==========================================

// Xem danh sách đánh giá của một món ăn (0.5 điểm) - Có phân trang
// Ví dụ: /items/123/reviews?page=1&limit=5
router.get('/items/:id/reviews', reviewController.getItemReviews);

// Thêm đánh giá mới (0.25 điểm) - Yêu cầu ĐĂNG NHẬP
// Dùng authMiddleware để lấy userId từ token và chặn khách chưa đăng nhập
// Logic controller phải check: User đã mua món này chưa?
router.post('/reviews',  reviewController.createReview);
router.get("/top-chef", menuController.getTopChefBestSeller);

module.exports = router;