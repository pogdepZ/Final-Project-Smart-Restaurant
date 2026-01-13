// src/services/cart.service.js
const { pool } = require("../config/db");
const {
  normalizeModifiers,
  modifiersKey,
} = require("../utils/normalizeModifiers");

// Lưu ý: bạn cần bảng `tables` có cột `code` (tableCode) như bạn đang dùng useParams tableCode ở FE.
function isUuid(v) {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v
    )
  );
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
// ✅ Add item using SAME transaction client
async function addItemToCartTx(client, input) {
  if (!input || typeof input !== "object") {
    const err = new Error("INVALID_ITEM_PAYLOAD");
    err.status = 400;
    throw err;
  }

  const {
    cartId,
    menuItemId,
    quantity = 1,
    modifiers = [],
    note = null,
  } = input;

  if (!cartId) {
    const err = new Error("MISSING_CART_ID");
    err.status = 400;
    throw err;
  }
  if (!menuItemId) {
    const err = new Error("MISSING_MENU_ITEM_ID");
    err.status = 400;
    throw err;
  }

  // cart must exist (same tx can see uncommitted insert)
  const cartRes = await client.query(
    `select id from carts where id = $1 limit 1`,
    [cartId]
  );
  if (!cartRes.rows[0]) {
    const err = new Error("CART_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  const normalized = normalizeModifiers(modifiers);
  const targetKey = modifiersKey(normalized);

  // find same menu item rows in this cart to compare modifiers
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

  const qtyToAdd = Math.max(1, Number(quantity || 1));

  if (matchedRow) {
    const newQty = (Number(matchedRow.quantity) || 0) + qtyToAdd;

    const up = await client.query(
      `update cart_items
       set quantity = $2, note = coalesce($3, note), updated_at = now()
       where id = $1
       returning id as "cartItemId"`,
      [matchedRow.id, newQty, note]
    );

    return { affected: up.rows[0] };
  } else {
    const ins = await client.query(
      `insert into cart_items (cart_id, menu_item_id, quantity, note, modifiers)
       values ($1, $2, $3, $4, $5::jsonb)
       returning id as "cartItemId"`,
      [cartId, menuItemId, qtyToAdd, note, JSON.stringify(normalized)]
    );

    return { affected: ins.rows[0] };
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

    const cartRes = await client.query(
      `select id from carts where id = $1 limit 1`,
      [cartId]
    );
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

const n = (x, d = 0) => {
  const v = Number(x);
  return Number.isFinite(v) ? v : d;
};

const normalizeModifiers2 = (mods = []) => {
  if (!Array.isArray(mods)) return [];
  return mods
    .map((m) => ({
      option_id: m?.option_id || m?.id || m?.modifier_option_id || null,
      modifier_name: m?.name || m?.modifier_name || m?.label || "Option",
      price: n(m?.price ?? m?.price_adjustment ?? 0, 0),
    }))
    .filter((m) => m.modifier_name); // giữ name
};

async function createOrderTx(client, { tableId, userId = null, note = null }) {
  const res = await client.query(
    `insert into public.orders (table_id, user_id, note, total_amount, status, payment_status)
     values ($1, $2, $3, 0, 'received', 'unpaid')
     returning *`,
    [tableId, userId, note]
  );
  return res.rows[0];
}

async function insertOrderItemTx(
  client,
  { orderId, menuItem, quantity, note }
) {
  const qty = Math.max(1, n(quantity, 1));

  // base price từ menu_items
  const basePrice = n(menuItem.price, 0);

  const subtotal = basePrice * qty;

  const res = await client.query(
    `insert into public.order_items
      (order_id, menu_item_id, item_name, price, quantity, subtotal, note)
     values
      ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      orderId,
      menuItem.id,
      menuItem.name,
      basePrice,
      qty,
      subtotal,
      note || null,
    ]
  );

  return res.rows[0];
}

async function insertOrderItemModifiersTx(
  client,
  { orderItemId, modifiers = [] }
) {
  if (!modifiers.length) return;

  const values = [];
  const params = [];
  let k = 1;

  for (const m of modifiers) {
    values.push(`($${k++}, $${k++}, $${k++}, $${k++})`);
    params.push(
      orderItemId,
      m.option_id, // modifier_option_id (nullable ok)
      m.modifier_name, // modifier_name
      n(m.price, 0) // price
    );
  }

  await client.query(
    `insert into public.order_item_modifiers
      (order_item_id, modifier_option_id, modifier_name, price)
     values ${values.join(", ")}`,
    params
  );
}

async function recalcOrderTotalTx(client, orderId) {
  // total = sum(order_items.subtotal) + sum(order_item_modifiers.price * order_items.quantity)
  // Vì modifiers lưu theo dòng item, và subtotal của item đang chỉ base*qty.
  const res = await client.query(
    `
    with base as (
      select coalesce(sum(subtotal),0) as base_total
      from public.order_items
      where order_id = $1
    ),
    mods as (
      select coalesce(sum(m.price * i.quantity),0) as mods_total
      from public.order_items i
      join public.order_item_modifiers m on m.order_item_id = i.id
      where i.order_id = $1
    )
    select (base.base_total + mods.mods_total) as total
    from base, mods
    `,
    [orderId]
  );

  const total = n(res.rows?.[0]?.total, 0);

  await client.query(
    `update public.orders set total_amount = $2, updated_at = now() where id = $1`,
    [orderId, total]
  );

  return total;
}

/**
 * ✅ Hàm chính: syncCartByTableId
 * - tạo order
 * - insert order_items
 * - insert order_item_modifiers
 * - update orders.total_amount
 * - return order + items + modifiers
 */
async function syncCartByTableId(
  { tableId, items = [], userId = null, note = null },
  io
) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    if (!tableId) {
      const err = new Error("MISSING_TABLE_ID");
      err.status = 400;
      throw err;
    }

    // 1) Tạo order
    const order = await createOrderTx(client, { tableId, userId, note });

    // 2) Insert từng item
    for (const it of items || []) {
      // ... (Phần logic insert item và modifiers giữ nguyên như cũ) ...
      // (Giả sử đoạn code insert item của bạn ở đây không đổi)
      if (!it?.menuItemId) {
        const err = new Error("MISSING_MENU_ITEM_ID");
        err.status = 400;
        throw err;
      }
      const menuRes = await client.query(
        `select id, name, price from public.menu_items where id = $1 limit 1`,
        [it.menuItemId]
      );
      const menuItem = menuRes.rows[0];
      if (!menuItem) throw new Error("MENU_ITEM_NOT_FOUND");

      const orderItem = await insertOrderItemTx(client, {
        orderId: order.id,
        menuItem,
        quantity: it.quantity ?? 1,
        note: it.note || null,
      });

      const mods = normalizeModifiers2(it.modifiers || []);
      await insertOrderItemModifiersTx(client, {
        orderItemId: orderItem.id,
        modifiers: mods,
      });
    }

    // 4) Tính total
    const total = await recalcOrderTotalTx(client, order.id);

    // 5) Lấy data trả về cho HTTP response (giữ nguyên logic cũ của bạn)
    const itemsRes = await client.query(
      `select * from public.order_items where order_id = $1 order by id asc`,
      [order.id]
    );
    const modsRes = await client.query(
      `select m.* from public.order_item_modifiers m join public.order_items i on i.id = m.order_item_id where i.order_id = $1 order by m.id asc`,
      [order.id]
    );

    // --- QUAN TRỌNG: COMMIT TRƯỚC KHI QUERY SOCKET ---
    await client.query("commit");

    // --- PHẦN SỬA LẠI ĐỂ BẮN SOCKET ---
    // Query này gom nhóm items thành mảng để Frontend Waiter/Kitchen hiển thị đúng
    const fullOrderRes = await client.query(
      `
      SELECT 
        o.*, 
        t.table_number,
        COALESCE(
            json_agg(
                json_build_object(
                    'name', oi.item_name,   -- Đổi key thành 'name' cho khớp Frontend
                    'qty', oi.quantity,     -- Đổi key thành 'qty' cho khớp Frontend
                    'price', oi.price,
                    'subtotal', oi.subtotal,
                    'note', oi.note
                )
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, t.table_number
      `,
      [order.id] // <--- SỬA LỖI: Dùng order.id (biến ở bước 1) thay vì newOrder.id
    );

    const orderToSend = fullOrderRes.rows[0];

    if (io && orderToSend) {
      // Gửi event new_order
      io.to("kitchen_room").emit("new_order", orderToSend);
    }

    return {
      order: { ...order, total_amount: total },
      items: itemsRes.rows,
      modifiers: modsRes.rows,
    };
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  getOrCreateActiveCartByTableCode,
  addItemToCartTx,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
  syncCartByTableId,
};
