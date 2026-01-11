const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/tableController');

// Public: verify QR token -> trả về table/restaurant context
//router.post('/verify', tableController.verifyQR);

module.exports = router;
