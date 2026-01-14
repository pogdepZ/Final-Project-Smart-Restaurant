const express = require("express");
const router = express.Router();
const adminDashboardController = require("../../controllers/adminDashboardController");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");

router.get("/", protect, adminDashboardController.getAdminDashboard);
router.get("/summary", protect, adminOnly, adminDashboardController.getSummary);
router.get(
  "/orders-daily",
  protect,
  adminOnly,
  adminDashboardController.getOrdersDaily
);
router.get(
  "/peak-hours",
  protect,
  adminOnly,
  adminDashboardController.getPeakHours
);
router.get(
  "/popular-items",
  protect,
  adminOnly,
  adminDashboardController.getPopularItems
);

router.get("/revenue", protect, adminOnly, adminDashboardController.getRevenue);

module.exports = router;
