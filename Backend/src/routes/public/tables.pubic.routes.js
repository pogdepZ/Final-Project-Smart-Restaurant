const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/tableController');
const { route } = require('./orders.public.routes');
const { protect } = require('../../middlewares/authMiddleware');

// Public: verify QR token -> trả về table/restaurant context
router.get('/my-tables', protect, tableController.getMyTables);
//router.post('/verify', tableController.verifyQR);
router.get('/', tableController.getTables)
router.get('/:id', tableController.getTableById)
// Get Assigned Tables (Waiter)


module.exports = router;
