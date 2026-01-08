const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Lấy danh sách bàn (Nhân viên cũng xem được)
router.get('/', protect, tableController.getTables);

// Tạo bàn mới (Chỉ Admin)
router.post('/', protect, adminOnly, tableController.createTable);

router.put('/:id', protect, adminOnly, tableController.updateTable);

router.patch('/:id/status', protect, adminOnly, tableController.toggleStatus);



// Xóa bàn (Chỉ Admin)

// router.delete('/:id', protect, adminOnly, tableController.deleteTable);

// router.post('/:id/regenerate', tableController.regenerateQR);
// router.post('/verify', tableController.verifyQR); // Thêm dòng này
// router.get('/download-zip', tableController.downloadAllQRs);
// router.post('/regenerate-all', tableController.regenerateAllQRs);


module.exports = router;