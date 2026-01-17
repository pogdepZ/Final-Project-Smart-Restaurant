const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/tableController');
const tableSessionController = require('../../controllers/tableSessionController');
const { protect } = require('../../middlewares/authMiddleware');

// Public: verify QR token -> trả về table/restaurant context
router.get('/my-tables', protect, tableController.getMyTables);

router.get('/validate-session', tableSessionController.validateSession);


//router.post('/verify', tableController.verifyQR);
router.get('/', tableController.getTables)
router.get('/:id', tableController.getTableById)
// Get Assigned Tables (Waiter)

// ===== TABLE SESSION ROUTES =====
// Kiểm tra và tạo session khi quét QR
router.post('/:tableCode/create-session', tableSessionController.checkAndCreateSession);

// Xác thực mã đặt bàn và kích hoạt session
router.post('/:tableCode/verify-booking', tableSessionController.verifyBookingAndActivateSession);

// Kết thúc session (khi thanh toán xong)
router.post('/:tableCode/end-session', tableSessionController.endSession);

// Validate session token
router.get('/validate-session', tableSessionController.validateSession);

module.exports = router;
