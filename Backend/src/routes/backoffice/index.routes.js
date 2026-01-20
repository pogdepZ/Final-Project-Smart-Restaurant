const express = require("express");
const router = express.Router();

router.use("/dashboard", require("./dashboard.routes"));
router.use("/menu", require("./menu.routes"));
router.use("/modifiers", require("./modifiers.admin.routes"));
router.use("/orders", require("./orders.routes"));
router.use("/tables", require("./tables.routes"));
router.use("/accounts", require("./accounts.routes"));
router.use("/upload", require("./upload.routes"));
router.use("/profile", require("./profile.routes.js"));
router.use("/coupons", require("./coupon.routes"));

module.exports = router;
