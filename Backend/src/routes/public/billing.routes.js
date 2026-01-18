const express = require('express');
const router = express.Router();
const billingController = require('../../controllers/billingController');
const { protect } = require('../../middlewares/authMiddleware');

router.post('/preview/table/:tableId', protect, billingController.previewTableBill);
router.post('/checkout/table/:tableId', protect, billingController.checkoutTable);

module.exports = router;