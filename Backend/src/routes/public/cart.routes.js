// src/routes/cart.routes.js
const router = require("express").Router();
const cartController = require("../../controllers/cartController");

// /api/cart/active?tableCode=TB01
router.get("/active", cartController.getActiveCart);

// /api/cart/items
router.post("/items", cartController.addItem);

// /api/cart/items/:cartItemId
router.patch("/items/:cartItemId", cartController.updateQuantity);
router.delete("/items/:cartItemId", cartController.removeItem);

// /api/cart/:cartId/items
router.delete("/:cartId/items", cartController.clearCart);

module.exports = router;
