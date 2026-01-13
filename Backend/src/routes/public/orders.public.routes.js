const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const { waiterOnly } = require('../../middlewares/authMiddleware'); // Đảm bảo đúng đường dẫn


// Public create order (phải verify QR token trong controller/middleware)
router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.patch('/:id', orderController.updateOrderStatus);

module.exports = router;
