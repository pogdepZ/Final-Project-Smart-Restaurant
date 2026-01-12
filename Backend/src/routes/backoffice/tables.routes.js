const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/tableController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

router.get('/', protect, tableController.getTables);
router.post('/', protect, adminOnly, tableController.createTable);
router.put('/:id', protect, adminOnly, tableController.updateTable);
router.patch('/:id/status', protect, adminOnly, tableController.toggleStatus);
router.post('/:id/regenerate', protect, adminOnly, tableController.regenerateQR);


module.exports = router;
