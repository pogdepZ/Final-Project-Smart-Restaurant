const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/tableController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');
const { verifyTableToken } = require('../../middlewares/customerMiddleware');

router.get('/', protect, tableController.getTables);
router.post('/', protect, adminOnly, tableController.createTable);
router.put('/:id', protect, adminOnly, tableController.updateTable);
router.patch('/:id/status', protect, adminOnly, tableController.toggleStatus);
router.post('/:id/regenerate', protect, adminOnly, tableController.regenerateQR);
router.post('/regenerate-all', protect, adminOnly, tableController.regenerateQR);

// Assign Table (Admin)
router.post('/assign', protect, adminOnly, tableController.assignTable);

module.exports = router;
