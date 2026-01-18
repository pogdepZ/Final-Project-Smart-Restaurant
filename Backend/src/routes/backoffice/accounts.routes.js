const express = require("express");
const router = express.Router();

const adminAccountController = require("../../controllers/adminAccountController");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");

// /admin/accounts
router.get("/", protect, adminOnly, adminAccountController.getAccounts);

// /admin/accounts/staff
router.post(
  "/staff",
  protect,
  adminOnly,
  adminAccountController.createStaffAccount,
);

// /admin/accounts/:id/verified
router.patch(
  "/:id/verified",
  protect,
  adminOnly,
  adminAccountController.setVerified,
);

// /admin/accounts/:id
router.delete("/:id", protect, adminOnly, adminAccountController.deleteAccount);

router.patch("/:id/actived", adminAccountController.setActived);

module.exports = router;
