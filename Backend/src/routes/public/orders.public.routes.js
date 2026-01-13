const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const { waiterOnly } = require('../../middlewares/authMiddleware'); // Đảm bảo đúng đường dẫn


// Public create order (phải verify QR token trong controller/middleware)
router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.patch('/:id', orderController.updateOrderStatus);
// router.patch('/:id', waiterOnly, orderController.updateOrderStatus);
router.patch('/items/:itemId', orderController.updateOrderItemStatus);
// router.patch('/items/:itemId', protect, orderController.updateOrderItemStatus);


module.exports = router;
