// src/controllers/cart.controller.js
const cartService = require("../services/cart.service");
const pool = require("../config/db");

function errorToHttp(res, err) {
  const status = err.status || 500;
  const message =
    err.message === "TABLE_NOT_FOUND" ? "Không tìm thấy bàn" :
      err.message === "CART_NOT_FOUND" ? "Không tìm thấy cart" :
        err.message === "CART_ITEM_NOT_FOUND" ? "Không tìm thấy cart item" :
          err.message === "INVALID_QUANTITY" ? "Quantity không hợp lệ" :
            "Lỗi server";
  return res.status(status).json({ message, code: err.message });
}

exports.getActiveCart = async (req, res) => {
  try {
    const tableCode = req.query.tableCode;
    if (!tableCode) return res.status(400).json({ message: "Thiếu tableCode" });

    // Nếu login thì lấy req.user.id, ở đây để null cho flow bàn
    const { cart, items } = await cartService.getOrCreateActiveCartByTableCode(tableCode, null);

    res.json({ cart, items });
  } catch (err) {
    return errorToHttp(res, err);
  }
};



exports.updateQuantity = async (req, res) => {
  try {
    const cartItemId = req.params.cartItemId;
    const { quantity } = req.body || {};
    const data = await cartService.updateCartItemQuantity(cartItemId, quantity);
    res.json(data); // { cartId, items }
  } catch (err) {
    return errorToHttp(res, err);
  }
};

exports.removeItem = async (req, res) => {
  try {
    const cartItemId = req.params.cartItemId;
    const data = await cartService.removeCartItem(cartItemId);
    res.json(data);
  } catch (err) {
    return errorToHttp(res, err);
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cartId = req.params.cartId;
    const data = await cartService.clearCartItems(cartId);
    res.json(data);
  } catch (err) {
    return errorToHttp(res, err);
  }
};


exports.syncCart = async (req, res, next) => {
  try {
    const tableId = req.qr?.table_id;
    if (!tableId) return res.status(400).json({ message: "QR_MISSING_TABLE" });

    const tRes = await pool.query(
      `select table_number from public.tables where id = $1 limit 1`,
      [tableId]
    );
    const tableNumber = tRes.rows[0]?.table_number;
    const guestName = tableNumber ? `Bàn ${tableNumber}` : "Guest";
    const { items } = req.body || {};
    
    let userId = null;
    if(req.user && req.user.id){
      userId = req.user.id;
    }
    
    const result = await cartService.syncCartByTableId({
      tableId,
      items: items || [],
      userId,
      guestName, 
      note: null,
    }, req.io);

    return res.json(result);
  } catch (e) {
    return next(e);
  }
};