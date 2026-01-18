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

// GROUPS
// GET /api/admin/modifier-groups
router.get(
  "/modifier-groups",
  protect,
  adminOnly,
  adminModifierController.getGroups
);

// GET /api/admin/modifier-groups/:id  (group + options)
router.get(
  "/modifier-groups/:id",
  protect,
  adminOnly,
  adminModifierController.getGroupDetail
);

// POST /api/admin/modifier-groups
router.post(
  "/modifier-groups",
  protect,
  adminOnly,
  adminModifierController.createGroup
);

// PATCH /api/admin/modifier-groups/:id
router.patch(
  "/modifier-groups/:id",
  protect,
  adminOnly,
  adminModifierController.updateGroup
);

// DELETE /api/admin/modifier-groups/:id
router.delete(
  "/modifier-groups/:id",
  protect,
  adminOnly,
  adminModifierController.deleteGroup
);

// OPTIONS (standalone endpoints)
// POST /api/admin/modifier-options
router.post(
  "/modifier-options",
  protect,
  adminOnly,
  adminModifierController.createOption
);

// PATCH /api/admin/modifier-options/:id
router.patch(
  "/modifier-options/:id",
  protect,
  adminOnly,
  adminModifierController.updateOption
);

// DELETE /api/admin/modifier-options/:id
router.delete(
  "/modifier-options/:id",
  protect,
  adminOnly,
  adminModifierController.deleteOption
);

module.exports = router;
