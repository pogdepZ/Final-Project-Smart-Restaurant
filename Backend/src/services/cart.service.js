// src/services/cart.service.js
const { pool } = require("../config/db");
const { normalizeModifiers, modifiersKey } = require("../utils/normalizeModifiers");

// Lưu ý: bạn cần bảng `tables` có cột `code` (tableCode) như bạn đang dùng useParams tableCode ở FE.
function isUuid(v) {
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// tableCode FE đang truyền thực chất là tables.id (uuid)
async function getTableIdByCode(client, tableCode) {
  if (!isUuid(tableCode)) return null;
  return tableCode;
}

async function getActiveCartByTableId(client, tableId) {
  const r = await client.query(
    `select * from carts
     where table_id = $1 and status = 'active'
     order by created_at desc
     limit 1`,
    [tableId]
  );
  return r.rows[0] || null;
}

async function createCart(client, { tableId, userId = null }) {
  const r = await client.query(
    `insert into carts (table_id, user_id, status)
     values ($1, $2, 'active')
     returning *`,
    [tableId, userId]
  );
  return r.rows[0];
}

async function listCartItems(client, cartId) {
  const r = await client.query(
    `select
        ci.id as "cartItemId",
        ci.cart_id as "cartId",
        ci.menu_item_id as "menuItemId",
        ci.quantity,
        ci.note,
        ci.modifiers,
        mi.name,
        mi.price,
        mi.image_url as "imageUrl"
     from cart_items ci
     join menu_items mi on mi.id = ci.menu_item_id
     where ci.cart_id = $1
     order by ci.created_at asc`,
    [cartId]
  );
  return r.rows;
}

async function getOrCreateActiveCartByTableCode(tableCode, userId = null) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const tableId = await getTableIdByCode(client, tableCode);
    if (!tableId) {
      const err = new Error("TABLE_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    let cart = await getActiveCartByTableId(client, tableId);
    if (!cart) cart = await createCart(client, { tableId, userId });

    const items = await listCartItems(client, cart.id);

    await client.query("commit");
    return { cart, items };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

// Add item: nếu cùng menuItemId + modifiers trùng -> update quantity
async function addItemToCart({ cartId, menuItemId, quantity = 1, modifiers = [], note = null }) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    // validate cart exists + active (optional chặt chẽ)
    const cartRes = await client.query(`select * from carts where id = $1 limit 1`, [cartId]);
    if (!cartRes.rows[0]) {
      const err = new Error("CART_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    const normalized = normalizeModifiers(modifiers);
    const targetKey = modifiersKey(normalized);

    // Lấy các dòng cùng menuItemId trong cart để so modifiers
    const sameItems = await client.query(
      `select id, modifiers, quantity
       from cart_items
       where cart_id = $1 and menu_item_id = $2`,
      [cartId, menuItemId]
    );

    let matchedRow = null;
    for (const row of sameItems.rows) {
      const rowKey = modifiersKey(row.modifiers ?? []);
      if (rowKey === targetKey) {
        matchedRow = row;
        break;
      }
    }

    let affected;
    if (matchedRow) {
      const newQty = matchedRow.quantity + Math.max(1, Number(quantity || 1));
      const up = await client.query(
        `update cart_items
         set quantity = $2, note = coalesce($3, note), updated_at = now()
         where id = $1
         returning id as "cartItemId"`,
        [matchedRow.id, newQty, note]
      );
      affected = up.rows[0];
    } else {
      const ins = await client.query(
        `insert into cart_items (cart_id, menu_item_id, quantity, note, modifiers)
         values ($1, $2, $3, $4, $5::jsonb)
         returning id as "cartItemId"`,
        [cartId, menuItemId, Math.max(1, Number(quantity || 1)), note, JSON.stringify(normalized)]
      );
      affected = ins.rows[0];
    }

    // trả cart full để FE chỉ cần loadCart 1 lần
    const items = await listCartItems(client, cartId);

    await client.query("commit");
    return { affected, items };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

async function updateCartItemQuantity(cartItemId, quantity) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const q = Number(quantity);
    if (!Number.isFinite(q)) {
      const err = new Error("INVALID_QUANTITY");
      err.status = 400;
      throw err;
    }

    // lấy cartId để trả items
    const found = await client.query(
      `select id, cart_id as "cartId" from cart_items where id = $1 limit 1`,
      [cartItemId]
    );
    const row = found.rows[0];
    if (!row) {
      const err = new Error("CART_ITEM_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    if (q <= 0) {
      await client.query(`delete from cart_items where id = $1`, [cartItemId]);
    } else {
      await client.query(
        `update cart_items
         set quantity = $2, updated_at = now()
         where id = $1`,
        [cartItemId, q]
      );
    }

    const items = await listCartItems(client, row.cartId);

    await client.query("commit");
    return { cartId: row.cartId, items };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

async function removeCartItem(cartItemId) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const found = await client.query(
      `select cart_id as "cartId" from cart_items where id = $1 limit 1`,
      [cartItemId]
    );
    const row = found.rows[0];
    if (!row) {
      const err = new Error("CART_ITEM_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    await client.query(`delete from cart_items where id = $1`, [cartItemId]);

    const items = await listCartItems(client, row.cartId);

    await client.query("commit");
    return { cartId: row.cartId, items };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

async function clearCartItems(cartId) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const cartRes = await client.query(`select id from carts where id = $1 limit 1`, [cartId]);
    if (!cartRes.rows[0]) {
      const err = new Error("CART_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    await client.query(`delete from cart_items where cart_id = $1`, [cartId]);

    await client.query("commit");
    return { cartId, items: [] };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  getOrCreateActiveCartByTableCode,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
};
