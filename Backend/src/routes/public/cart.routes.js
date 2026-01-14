// src/routes/cart.routes.js
const router = require("express").Router();
const cartController = require("../../controllers/cartController");
const { requireQrToken } = require("../../middlewares/qrToken");
const { optionalAuth } = require("../../middlewares/optionalAuth");

// /api/cart/active?tableCode=TB01
router.get("/active", cartController.getActiveCart);


// /api/cart/items/:cartItemId
router.patch("/items/:cartItemId", cartController.updateQuantity);
router.delete("/items/:cartItemId", cartController.removeItem);

// /api/cart/:cartId/items
router.delete("/:cartId/items", cartController.clearCart);


router.post("/sync", requireQrToken, optionalAuth, cartController.syncCart);

module.exports = router;
