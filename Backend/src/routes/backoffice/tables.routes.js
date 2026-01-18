const express = require("express");
const router = express.Router();
const tableController = require("../../controllers/tableController");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");
const { verifyTableToken } = require("../../middlewares/customerMiddleware");
const asignmentCotroller = require("../../controllers/tableAssignmentController");

router.get("/", protect, tableController.getTables);
router.post("/", protect, adminOnly, tableController.createTable);
router.put("/:id", protect, adminOnly, tableController.updateTable);
router.patch("/:id/status", protect, adminOnly, tableController.toggleStatus);
router.post(
  "/:id/regenerate",
  protect,
  adminOnly,
  tableController.regenerateQR,
);
router.post(
  "/regenerate-all",
  protect,
  adminOnly,
  tableController.BulkRegenerateQR,
);

// Assign Table (Admin)

router.get("/waiters", asignmentCotroller.getWaiters);

router.get("/table-assignments", asignmentCotroller.listAll); // optional
router.get("/table-assignments/:waiterId", asignmentCotroller.getByWaiter);
router.put("/table-assignments/:waiterId", asignmentCotroller.replaceByWaiter);

module.exports = router;
