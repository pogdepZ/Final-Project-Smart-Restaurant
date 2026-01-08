const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

router.get('/', staffController.getStaffs);
router.post('/', staffController.createStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;