const express = require('express');
const router = express.Router();
const staffController = require('../../controllers/staffController');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

router.get('/', protect, adminOnly, staffController.getStaffs);
router.post('/', protect, adminOnly, staffController.createStaff);
router.delete('/:id', protect, adminOnly, staffController.deleteStaff);

module.exports = router;
