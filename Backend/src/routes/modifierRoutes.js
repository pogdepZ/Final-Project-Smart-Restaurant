const express = require('express');
const router = express.Router();
const modifierController = require('../controllers/modifierController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// 1. Lấy danh sách nhóm (Để hiển thị lên UI quản lý)
router.get('/', protect, modifierController.getGroups);

// 2. Tạo nhóm mới
router.post('/', protect, adminOnly, modifierController.createGroup);

// 3. Cập nhật nhóm
router.put('/:id', protect, adminOnly, modifierController.updateGroup);

// 4. Thêm Option cho nhóm
router.post('/:group_id/options', protect, adminOnly, modifierController.addOption);

module.exports = router;