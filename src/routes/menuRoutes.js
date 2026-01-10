const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const photoController = require('../controllers/photoController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const upload = require('../config/cloudinary'); // Config upload ảnh
const modifierController = require('../controllers/modifierController');

// --- ROUTES DANH MỤC ---
// Ai cũng xem được danh mục
router.get('/categories', menuController.getCategories);

// Chỉ Admin mới được tạo danh mục (Cần Token)
router.post('/categories', protect, adminOnly, menuController.createCategory);
router.put('/categories/:id', protect, adminOnly, menuController.updateCategory); 

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


// ==========================================
// 3. PHOTOS MANAGEMENT (Tách Controller)
// ==========================================

// Lấy danh sách ảnh
router.get('/items/:id/photos', photoController.getItemPhotos);

// Upload nhiều ảnh
router.post('/items/:id/photos', 
    protect, 
    adminOnly, 
    upload.array('photos', 5), 
    photoController.addItemPhotos
);

// Xóa ảnh
router.delete('/items/:id/photos/:photoId', protect, adminOnly, photoController.deletePhoto);

// Đặt ảnh đại diện
router.patch('/items/:id/photos/:photoId/primary', protect, adminOnly, photoController.setPrimaryPhoto);


// --- MODIFIERS ROUTES ---
// 1. Lấy danh sách nhóm
router.get('/modifiers', protect, modifierController.getGroups);

// 2. Tạo nhóm (Yêu cầu 4.1)
router.post('/modifiers', protect, adminOnly, modifierController.createGroup);

// 3. Thêm Option vào nhóm (Yêu cầu 4.2)
router.post('/modifiers/:group_id/options', protect, adminOnly, modifierController.addOption);

// 4. Gắn nhóm vào Món ăn (Yêu cầu 4.3)
router.post('/items/:item_id/modifiers', protect, adminOnly, modifierController.attachGroupToItem);

module.exports = router;
