const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/tableController');
const { route } = require('./orders.public.routes');

// Public: verify QR token -> trả về table/restaurant context
//router.post('/verify', tableController.verifyQR);
router.get('/', tableController.getTables)
router.get('/:id', tableController.getTableById)

module.exports = router;
