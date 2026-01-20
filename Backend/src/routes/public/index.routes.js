const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.public.routes"));
router.use("/menu", require("./menu.public.routes"));
router.use("/orders", require("./orders.public.routes"));
router.use("/qr", require("./qr.public.routes"));
router.use("/tables", require("./tables.pubic.routes"));
router.use("/cart", require("./cart.routes"));
router.use("/users", require("./user.routes"));
router.use("/billing", require("./billing.routes"));
router.use("/bill-requests", require("./billRequest.routes"));
router.use("/stripe", require("./stripe.routes"));
router.use("/coupons", require("./coupon.routes"));

module.exports = router;
