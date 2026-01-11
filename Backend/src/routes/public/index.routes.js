const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.public.routes'));
router.use('/menu', require('./menu.public.routes'));
router.use('/orders', require('./orders.public.routes'));
router.use('/qr', require('./qr.public.routes'));

module.exports = router;
