const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const { waiterOnly, protect } = require("../../middlewares/authMiddleware"); // Đảm bảo đúng đường dẫn

// Public create order (phải verify QR token trong controller/middleware)
router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);

// Lấy đơn hàng theo table token (cho khách hàng)
router.get("/by-table", orderController.getOrdersByTable);


router.patch("/:id", orderController.updateOrderStatus);
// router.patch('/:id', waiterOnly, orderController.updateOrderStatus);
router.patch("/items/:itemId", orderController.updateOrderItemStatus);
router.get("/my", protect, orderController.getMyOrders);
router.get("/:id", protect, orderController.getMyOrderDetail);

// Lấy đơn hàng theo table token (cho khách hàng)

// Lấy chi tiết đơn để tracking (cho khách hàng)
router.get("/:id/tracking", orderController.getOrderTracking);

module.exports = router;
