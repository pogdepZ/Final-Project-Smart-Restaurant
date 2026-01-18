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
const adminCategoryController = require("../../controllers/adminCategoryController");

// Categories
router.get(
  "/categories",
  protect,
  adminOnly,
  adminMenuController.getCategories,
);

// Items (paging + filter)
router.get("/items", protect, adminOnly, adminMenuController.getMenuItems);
router.get(
  "/items/:id",
  protect,
  adminOnly,
  adminMenuController.getMenuItemDetail,
);

router.post("/items", protect, adminOnly, adminMenuController.createMenuItem);
router.patch(
  "/items/:id",
  protect,
  adminOnly,
  adminMenuController.updateMenuItem,
);
router.patch(
  "/items/:id/chef",
  protect,
  staffOnly,
  adminMenuController.toggleChefRecommended,
);

router.patch(
  "/items/:id/delete",
  protect,
  adminOnly,
  adminMenuController.deleteMenuItem,
);

// Categories
router.post(
  "/categories",
  protect,
  adminOnly,
  adminMenuController.createCategory,
);

router.put(
  "/items/:id/modifier-groups",
  adminMenuController.setMenuItemModifierGroups,
);

// POST /admin/categories
router.post("/categories", protect, adminOnly, adminCategoryController.create);

// PATCH /admin/categories/:id
router.patch(
  "/categories/:id",
  protect,
  adminOnly,
  adminCategoryController.update,
);

// DELETE /admin/categories/:id  (soft delete + check order)
router.patch(
  "/categories/:id/delete",
  protect,
  adminOnly,
  adminCategoryController.remove,
);

router.get(
  "/list-categories",
  protect,
  adminOnly,
  adminCategoryController.list,
);

router.get("/menu-items/:id/photos", adminMenuController.getPhotos);

// Upload nhiều ảnh
router.post(
  "/menu-items/:id/photos",
  upload.array("images", 10),
  adminMenuController.uploadPhotos,
);

// Set primary
router.patch(
  "/menu-items/:id/photos/:photoId/primary",
  adminMenuController.setPrimary,
);

// Delete 1 ảnh (optional)
router.delete(
  "/menu-items/:id/photos/:photoId",
  adminMenuController.deletePhoto,
);

module.exports = router;
