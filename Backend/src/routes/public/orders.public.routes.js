const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");

// Public create order (phải verify QR token trong controller/middleware)
router.post("/", orderController.createOrder);

module.exports = router;
