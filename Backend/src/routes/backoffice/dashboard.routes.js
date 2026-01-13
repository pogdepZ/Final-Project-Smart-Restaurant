const express = require("express");
const router = express.Router();
const adminDashboardController = require("../../controllers/adminDashboardController");
const { protect } = require("../../middlewares/authMiddleware");

router.get("/", protect, adminDashboardController.getAdminDashboard);

module.exports = router;
