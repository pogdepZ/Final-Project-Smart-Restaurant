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
  // Query phức tạp sử dụng JSON_AGG để gom nhóm dữ liệu ngay từ Database
  let query = `
    SELECT 
      o.id, 
      o.status, 
      o.total_amount, 
      o.created_at, 
      o.guest_name, 
      o.note, 
      o.table_id,
      t.table_number,
      COALESCE(
          json_agg(
              json_build_object(
                  'id', oi.id,
                  'name', oi.item_name,   -- Map thành 'name' cho Frontend OrderCard
                  'qty', oi.quantity,     -- Map thành 'qty' cho Frontend
                  'price', oi.price,
                  'subtotal', oi.subtotal,
                  'note', oi.note,
                  'status', oi.status,
                  'modifiers', (
                      -- Sub-query lấy modifiers của từng item
                      SELECT COALESCE(
                          json_agg(json_build_object(
                              'name', oim.modifier_name, 
                              'price', oim.price
                          )), '[]'
                      )
                      FROM order_item_modifiers oim 
                      WHERE oim.order_item_id = oi.id
                  )
              )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) as items
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
  `;

  const params = [];

  // Filter theo status nếu có (Ví dụ: ?status=received)
  if (status) {
    query += ` WHERE o.status = $1`;
    params.push(status);
  }

  // Group by bắt buộc khi dùng hàm aggregate
  query += ` GROUP BY o.id, t.id, t.table_number ORDER BY o.created_at DESC`;

  const result = await db.query(query, params);
  return result.rows;
};

// 5. Lấy chi tiết đơn theo ID
exports.getById = async (id) => {
  const query = `
    SELECT 
      o.*, 
      t.table_number,
      COALESCE(
          json_agg(
              json_build_object(
                  'id', oi.id,
                  'name', oi.item_name,  
                  'qty', oi.quantity,
                  'price', oi.price,
                  'subtotal', oi.subtotal,
                  'note', oi.note,
                  'status', oi.status,
                  'modifiers', (
                      SELECT COALESCE(
                          json_agg(json_build_object(
                              'name', oim.modifier_name, 
                              'price', oim.price
                          )), '[]'
                      )
                      FROM order_item_modifiers oim 
                      WHERE oim.order_item_id = oi.id
                  )
              )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) as items
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = $1
    GROUP BY o.id, t.table_number
  `;
  
  const result = await db.query(query, [id]);
  return result.rows[0];
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


// 2. Thêm hàm updateItemStatus
exports.updateItemStatus = async (itemId, status) => {
    const result = await db.query(
        `UPDATE order_items SET status = $1 WHERE id = $2 RETURNING *`,
        [status, itemId]
    );
    return result.rows[0];
};

// 3. Hàm trừ tiền đơn hàng (Khi từ chối món)
exports.decreaseOrderTotal = async (orderId, amount) => {
    await db.query(
        `UPDATE orders SET total_amount = total_amount - $1 WHERE id = $2`,
        [amount, orderId]
    );
};