const express = require("express");
const router = express.Router();

const menuController = require("../../controllers/menuController");
const photoController = require("../../controllers/photoController");
const modifierController = require("../../controllers/modifierController");

const {
  protect,
  adminOnly,
  staffOnly,
} = require("../../middlewares/authMiddleware");
const upload = require("../../config/cloudinary");

const adminMenuController = require("../../controllers/adminMenuController");

// Categories
router.get(
  "/categories",
  protect,
  adminOnly,
  adminMenuController.getCategories
);

// Items (paging + filter)
router.get("/items", protect, adminOnly, adminMenuController.getMenuItems);
router.get(
  "/items/:id",
  protect,
  adminOnly,
  adminMenuController.getMenuItemDetail
);

router.post("/items", protect, adminOnly, adminMenuController.createMenuItem);
router.patch(
  "/items/:id",
  protect,
  adminOnly,
  adminMenuController.updateMenuItem
);
router.patch(
  "/items/:id/chef",
  protect,
  staffOnly,
  adminMenuController.toggleChefRecommended
);

router.patch(
  "/items/:id/delete",
  protect,
  adminOnly,
  adminMenuController.deleteMenuItem
);

// Categories
router.post(
  "/categories",
  protect,
  adminOnly,
  adminMenuController.createCategory
);

module.exports = router;
