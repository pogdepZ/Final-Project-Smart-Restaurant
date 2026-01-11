const express = require('express');
const router = express.Router();

const menuController = require('../../controllers/menuController');
const photoController = require('../../controllers/photoController');
const modifierController = require('../../controllers/modifierController');

const { protect, adminOnly } = require('../../middlewares/authMiddleware');
const upload = require('../../config/cloudinary');

// --- Categories (Admin) ---
router.post('/categories', protect, adminOnly, menuController.createCategory);
router.put('/categories/:id', protect, adminOnly, menuController.updateCategory);

// --- Items (Admin) ---
router.post(
  '/items',
  protect,
  adminOnly,
  upload.single('image'),
  menuController.createMenuItem
);

router.put(
  '/items/:id',
  protect,
  adminOnly,
  upload.single('image'),
  menuController.updateMenuItem
);

router.delete('/items/:id', protect, adminOnly, menuController.deleteMenuItem);

// --- Photos management (Admin) ---
router.post(
  '/items/:id/photos',
  protect,
  adminOnly,
  upload.array('photos', 5),
  photoController.addItemPhotos
);

router.delete(
  '/items/:id/photos/:photoId',
  protect,
  adminOnly,
  photoController.deletePhoto
);

router.patch(
  '/items/:id/photos/:photoId/primary',
  protect,
  adminOnly,
  photoController.setPrimaryPhoto
);

// --- Modifiers (Admin) ---
router.get('/modifiers', protect, adminOnly, modifierController.getGroups);

router.post('/modifiers', protect, adminOnly, modifierController.createGroup);
router.post('/modifiers/:group_id/options', protect, adminOnly, modifierController.addOption);
router.post('/items/:item_id/modifiers', protect, adminOnly, modifierController.attachGroupToItem);

module.exports = router;
