const express = require("express");
const router = express.Router();


const userController = require("../../controllers/userController");
const { protect } = require("../../middlewares/authMiddleware"); // hoặc passport jwt của bạn
const upload = require("../../middlewares/upload");

router.get("/me", protect, userController.getMe);
router.put("/me", protect, userController.updateMe);
router.post("/me/avatar", protect, upload.single("avatar"), userController.uploadMyAvatar);
router.post("/me/change-password", protect, userController.changePassword);

module.exports = router;
