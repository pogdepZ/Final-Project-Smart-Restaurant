const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// GET /api/dashboard/admin
router.get("/dashboard", protect, adminOnly, dashboardController.getAdminDashboard);

module.exports = router;
