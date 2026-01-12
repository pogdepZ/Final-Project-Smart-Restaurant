const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const { protect } = require("../../middlewares/authMiddleware");

router.get("/", protect, orderController.getOrders);
router.get("/:id", protect, orderController.getOrderDetails);
router.patch("/:id", protect, orderController.updateOrderStatus);

module.exports = router;
