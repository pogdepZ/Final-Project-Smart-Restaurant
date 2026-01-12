const db = require("../config/db");

// 1. Tạo Đơn hàng (Chạy trong Transaction - nhận client từ Service)
exports.createOrder = async (
  client,
  { table_id, guest_name, total_amount, note }
) => {
  const result = await client.query(
    `INSERT INTO orders (table_id, guest_name, total_amount, note, status, payment_status) 
             VALUES ($1, $2, $3, $4, 'received', 'unpaid') RETURNING *`,
    [table_id, guest_name || "Khách lẻ", total_amount, note]
  );
  return result.rows[0];
};

// 2. Tạo Chi tiết đơn (Item)
exports.createOrderItem = async (
  client,
  { order_id, menu_item_id, item_name, price, quantity, subtotal, note }
) => {
  const result = await client.query(
    `INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity, subtotal, note)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [order_id, menu_item_id, item_name, price, quantity, subtotal, note]
  );
  return result.rows[0];
};

// 3. Tạo Modifier cho Item
exports.createOrderItemModifier = async (
  client,
  { order_item_id, modifier_option_id, modifier_name, price }
) => {
  await client.query(
    `INSERT INTO order_item_modifiers (order_item_id, modifier_option_id, modifier_name, price)
             VALUES ($1, $2, $3, $4)`,
    [order_item_id, modifier_option_id, modifier_name, price]
  );
};

// 4. Lấy danh sách đơn (Kèm thông tin bàn và Items gom nhóm)
exports.getAll = async ({ status }) => {
  let query = `
            SELECT o.*, t.table_number,
            COALESCE(
                json_agg(
                    json_build_object(
                        'item_name', oi.item_name,
                        'quantity', oi.quantity,
                        'subtotal', oi.subtotal,
                        'note', oi.note
                    )
                ) FILTER (WHERE oi.id IS NOT NULL), '[]'
            ) as items
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
        `;
  const params = [];

  if (status) {
    query += ` WHERE o.status = $1`;
    params.push(status);
  }

  query += ` GROUP BY o.id, t.table_number ORDER BY o.created_at DESC`;

  const result = await db.query(query, params);
  return result.rows;
};

// 5. Lấy chi tiết đơn theo ID
exports.getById = async (id) => {
  // Lấy thông tin chung
  const orderRes = await db.query(
    `SELECT o.*, t.table_number 
             FROM orders o 
             LEFT JOIN tables t ON o.table_id = t.id WHERE o.id = $1`,
    [id]
  );
  if (orderRes.rows.length === 0) return null;
  const order = orderRes.rows[0];

  // Lấy items và modifiers
  const itemsRes = await db.query(
    `
            SELECT 
                oi.*,
                COALESCE(
                    json_agg(json_build_object('name', oim.modifier_name, 'price', oim.price)) 
                    FILTER (WHERE oim.id IS NOT NULL), '[]'
                ) as modifiers
            FROM order_items oi
            LEFT JOIN order_item_modifiers oim ON oi.id = oim.order_item_id
            WHERE oi.order_id = $1
            GROUP BY oi.id
        `,
    [id]
  );

  order.items = itemsRes.rows;
  return order;
};

// 6. Cập nhật trạng thái
exports.updateStatus = async (id, { status, payment_status }) => {
  let query = "UPDATE orders SET updated_at = NOW()";
  const params = [id];
  let idx = 2;

  if (status) {
    query += `, status = $${idx++}`;
    params.push(status);
  }
  if (payment_status) {
    query += `, payment_status = $${idx++}`;
    params.push(payment_status);
  }

  query += ` WHERE id = $1 RETURNING *`;

  const result = await db.query(query, params);
  return result.rows[0];
};
