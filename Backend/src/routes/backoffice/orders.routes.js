const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const adminOrderController = require("../../controllers/adminOrderController");
const { protect } = require("../../middlewares/authMiddleware");

router.get("/", protect, adminOrderController.listOrders);
router.get("/:id", protect, adminOrderController.getOrderDetail);
router.patch("/:id", protect, orderController.updateOrderStatus);

module.exports = router;
