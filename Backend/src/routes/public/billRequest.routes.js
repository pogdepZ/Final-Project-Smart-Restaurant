const express = require("express");
const router = express.Router();
const controller = require("../../controllers/billRequestController");
const { protect, waiterOnly } = require("../../middlewares/authMiddleware");

// Public route - Khách gửi yêu cầu thanh toán
router.post("/request", controller.requestBill);

// Public route - Kiểm tra trạng thái yêu cầu của bàn
router.get("/status/:tableId", controller.getRequestStatus);

// Protected routes - Chỉ Staff
router.get(
  "/pending",
  protect,
  waiterOnly,
  controller.getPendingRequests
);

router.patch(
  "/:id/acknowledge",
  protect,
  waiterOnly,
  controller.acknowledgeRequest
);

router.delete(
  "/:id",
  protect,
  waiterOnly,
  controller.cancelRequest
);

module.exports = router;
