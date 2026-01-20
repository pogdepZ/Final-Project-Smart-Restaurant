const express = require("express");
const router = express.Router();
const stripeController = require("../../controllers/stripeController");
const { protect } = require("../../middlewares/authMiddleware");

// Public: Lấy Stripe config (publishable key)
router.get("/config", stripeController.getConfig);

// Protected: Tạo Payment Intent
router.post(
  "/create-payment-intent/:tableId",
  protect,
  stripeController.createPaymentIntent,
);

// Protected: Tạo Payment Link (QR Code)
router.post(
  "/create-payment-link/:tableId",
  protect,
  stripeController.createPaymentLink,
);

// Protected: Xác nhận thanh toán
router.post("/confirm-payment", protect, stripeController.confirmPayment);

// Public: Lấy trạng thái payment
router.get(
  "/payment-status/:paymentIntentId",
  stripeController.getPaymentStatus,
);

// Public: Kiểm tra trạng thái Checkout Session
router.get("/session-status/:sessionId", stripeController.getSessionStatus);

// Webhook từ Stripe (cần raw body)
// Lưu ý: Route này phải được đăng ký TRƯỚC middleware express.json()
// hoặc sử dụng express.raw() riêng cho route này

module.exports = router;
