// src/routes/backoffice/coupon.routes.js
const router = require("express").Router();
const couponController = require("../../controllers/couponController");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");

// Tất cả routes cần auth admin
router.use(protect);
router.use(adminOnly);

// GET /api/admin/coupons - Lấy danh sách coupons
router.get("/", couponController.getAllCoupons);

// POST /api/admin/coupons - Tạo coupon mới
router.post("/", couponController.createCoupon);

// PUT /api/admin/coupons/:id - Cập nhật coupon
router.put("/:id", couponController.updateCoupon);

// DELETE /api/admin/coupons/:id - Xóa coupon
router.delete("/:id", couponController.deleteCoupon);

module.exports = router;
