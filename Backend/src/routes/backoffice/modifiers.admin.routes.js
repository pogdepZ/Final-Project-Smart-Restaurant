const express = require("express");
const router = express.Router();
const modifierController = require("../../controllers/modifierController");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");
const adminModifierController = require("../../controllers/adminModifierController");

// Admin manage modifiers
// router.get('/', protect, adminOnly, modifierController.getGroups);
router.get("/", protect, adminOnly, adminModifierController.getModifierGroups);
router.post("/", protect, adminOnly, modifierController.createGroup);
router.put("/:id", protect, adminOnly, modifierController.updateGroup);
router.post(
  "/:group_id/options",
  protect,
  adminOnly,
  modifierController.addOption
);

module.exports = router;
