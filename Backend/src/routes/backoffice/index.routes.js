const express = require('express');
const router = express.Router();

router.use('/dashboard', require('./dashboard.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/modifiers', require('./modifiers.admin.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/tables', require('./tables.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/upload', require('./upload.routes'));
  
module.exports = router;
