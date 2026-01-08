const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Lấy danh sách bàn (Nhân viên cũng xem được)
router.get('/', protect, tableController.getTables);

// Tạo bàn mới (Chỉ Admin)
router.post('/', protect, adminOnly, tableController.createTable);

// Xóa bàn (Chỉ Admin)
router.delete('/:id', protect, adminOnly, tableController.deleteTable);

router.post('/:id/regenerate', tableController.regenerateQR);
router.post('/verify', tableController.verifyQR); // Thêm dòng này
router.patch('/:id/status', tableController.updateTableStatus); // [MỚI] Dùng method PATCHnpm
router.put('/:id', tableController.updateTable); // Thêm dòng này (PUT)
router.get('/download-zip', tableController.downloadAllQRs);
router.post('/regenerate-all', tableController.regenerateAllQRs);


module.exports = router;