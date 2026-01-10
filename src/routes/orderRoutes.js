const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

router.post("/", orderController.createOrder); // Đặt món (Cần xử lý bảo mật token bàn sau)

router.get("/", protect, orderController.getOrders); // Xem danh sách (KDS)
router.get("/:id", protect, orderController.getOrderDetails); // Xem chi tiết
router.patch("/:id", protect, orderController.updateOrderStatus); // Cập nhật trạng thái

module.exports = router;
