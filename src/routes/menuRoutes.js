const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const upload = require('../config/cloudinary'); // Config upload ảnh

// --- ROUTES DANH MỤC ---
// Ai cũng xem được danh mục
router.get('/categories', menuController.getCategories);

// Chỉ Admin mới được tạo danh mục (Cần Token)
router.post('/categories', protect, adminOnly, menuController.createCategory);

// --- ROUTES MÓN ĂN ---
router.get('/items', menuController.getMenuItems); // Public (để khách xem)
router.get('/items/:id', menuController.getMenuItemById); // Public (xem chi tiết)

// Tạo món ăn: Cần Login -> Cần là Admin -> Upload ảnh -> Xử lý logic
router.post('/items', 
    protect, 
    adminOnly, 
    upload.single('image'), // 'image' là tên field trong Form Data
    menuController.createMenuItem
);


router.post('/items', protect, adminOnly, upload.single('image'), menuController.createMenuItem);
router.put('/items/:id', protect, adminOnly, upload.single('image'), menuController.updateMenuItem); // <--- MỚI
router.delete('/items/:id', protect, adminOnly, menuController.deleteMenuItem);

module.exports = router;



// // server/src/routes/menuRoutes.js
// const express = require('express');
// const router = express.Router();
// const menuController = require('../controllers/menuController');

// // Import middleware và schema
// const validate = require('../middlewares/validate');
// const { createItemSchema, createCategorySchema } = require('../validations/menuValidation');

// const upload = require('../middlewares/upload'); // Import middleware

// // --- 1. GUEST & APP VIEW ---
// router.get('/', menuController.getFullMenu);

// // --- 2. QUẢN LÝ DANH MỤC ---
// router.get('/categories', menuController.getCategories);
// // Áp dụng validate cho Create Category
// router.post('/categories', validate(createCategorySchema), menuController.createCategory);
// router.put('/categories/:id', validate(createCategorySchema), menuController.updateCategory);
// router.delete('/categories/:id', menuController.deleteCategory);

// // --- 3. QUẢN LÝ MÓN ĂN ---
// // Áp dụng validate cho Create Item
// router.post('/items', validate(createItemSchema), menuController.createItem);
// router.delete('/items/:id', menuController.deleteItem);


// router.post('/items/:id/photos', upload.array('photos', 5), menuController.addItemPhotos);
// router.delete('/photos/:photoId', menuController.deleteItemPhoto);
// router.put('/items/:itemId/photos/:photoId/primary', menuController.setPrimaryPhoto);
// router.put('/items/:id', validate(createItemSchema), menuController.updateItem);


// module.exports = router;