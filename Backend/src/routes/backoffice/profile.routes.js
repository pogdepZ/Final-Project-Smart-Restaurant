const express = require("express");
const router = express.Router();
const adminProfileController = require("../../controllers/adminProfileController");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/upload");

// GET profile
router.get("/", protect, adminOnly, adminProfileController.getMyProfile);

// UPDATE name
router.patch("/", protect, adminOnly, adminProfileController.updateMyProfile);

// UPLOAD avatar (Cloudinary)
router.post(
  "/avatar",
  protect,
  adminOnly,
  upload.single("avatar"),
  adminProfileController.uploadMyAvatar
);

module.exports = router;
