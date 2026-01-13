const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refreshToken);
router.get('/check-email', authController.checkEmail);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verify", authController.resendVerifyEmail);

module.exports = router;
