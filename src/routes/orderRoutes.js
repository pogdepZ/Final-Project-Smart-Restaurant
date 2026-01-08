const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus); // <-- THÊM DÒNG NÀY
router.post('/checkout', orderController.checkoutSession);
router.post('/preview', orderController.previewSession);

module.exports = router;