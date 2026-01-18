const db = require("../config/db");

// 1. Tạo Đơn hàng (Chạy trong Transaction - nhận client từ Service)
exports.createOrder = async (
  client,
  { table_id, guest_name, total_amount, note }
) => {
  const result = await client.query(
    `INSERT INTO orders (
        table_id, guest_name, total_amount, note, status, payment_status, created_at, updated_at
     ) 
     VALUES (
        $1, $2, $3, $4, 'received', 'unpaid', 
        NOW(),
        NOW()
     ) 
     RETURNING *`,
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
                  'prep_time_minutes', COALESCE(mi.prep_time_minutes, 15),
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
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
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

// 4. Hàm cập nhật status của tất cả items trong một order
exports.updateAllItemsStatusByOrderId = async (orderId, itemStatus) => {
  const result = await db.query(
    `UPDATE order_items SET status = $1 WHERE order_id = $2 AND status != 'rejected' RETURNING *`,
    [itemStatus, orderId]
  );
  return result.rows;
};

exports.findManyByUserId = async (userId, { page, limit }) => {
  const offset = (page - 1) * limit;

  // total
  const totalRs = await db.query(
    `select count(*)::int as total from orders where user_id = $1`,
    [userId]
  );
  const total = totalRs.rows[0]?.total || 0;

  // list orders + items
  const rs = await db.query(
    `
    select
      o.id,
      o.status,
      o.payment_status,
      o.total_amount,
      o.created_at,
      t.table_number,
      coalesce(
        json_agg(
          json_build_object(
            'id', oi.id,
            'item_name', oi.item_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.subtotal,
            'status', oi.status,
            'note', oi.note
          )
          order by oi.created_at asc
        ) filter (where oi.id is not null),
        '[]'::json
      ) as items
    from orders o
    left join tables t on t.id = o.table_id
    left join order_items oi on oi.order_id = o.id
    where o.user_id = $1
    group by o.id, t.table_number
    order by o.created_at desc
    limit $2 offset $3
    `,
    [userId, limit, offset]
  );

  return { rows: rs.rows || [], total };
};

exports.findManyByUserId = async (userId, { page, limit }) => {
  const offset = (page - 1) * limit;

  const totalRs = await db.query(
    `select count(*)::int as total from orders where user_id = $1`,
    [userId]
  );
  const total = totalRs.rows[0]?.total || 0;

  const rs = await db.query(
    `
    select
      o.id,
      o.status,
      o.payment_status,
      o.total_amount,
      o.note,
      o.created_at,
      t.table_number,
      coalesce(
        json_agg(
          json_build_object(
            'id', oi.id,
            'item_name', oi.item_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.subtotal,
            'status', oi.status,
            'note', oi.note
          )
          order by oi.id asc
        ) filter (where oi.id is not null),
        '[]'::json
      ) as items
    from orders o
    left join tables t on t.id = o.table_id
    left join order_items oi on oi.order_id = o.id
    where o.user_id = $1
    group by o.id, t.table_number
    order by o.created_at desc
    limit $2 offset $3
    `,
    [userId, limit, offset]
  );

  return { rows: rs.rows || [], total };
};

exports.findOneByIdAndUserId = async (orderId, userId) => {
  const rs = await db.query(
    `
    select
      o.id,
      o.status,
      o.payment_status,
      o.total_amount,
      o.note,
      o.created_at,
      t.table_number,
      coalesce(
        json_agg(
          json_build_object(
            'id', oi.id,
            'item_name', oi.item_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.subtotal,
            'status', oi.status,
            'note', oi.note
          )
          order by oi.id asc
        ) filter (where oi.id is not null),
        '[]'::json
      ) as items
    from orders o
    left join tables t on t.id = o.table_id
    left join order_items oi on oi.order_id = o.id
    where o.id = $1 and o.user_id = $2
    group by o.id, t.table_number
    limit 1
    `,
    [orderId, userId]
  );

  return rs.rows[0] || null;
};

// Lấy đơn hàng theo table ID
exports.findByTableId = async (tableId) => {
  const query = `
    SELECT 
      o.id, 
      o.status, 
      o.total_amount, 
      o.created_at, 
      o.guest_name, 
      o.note, 
      o.table_id,
      o.payment_status,
      ('ORD-' || to_char(o.created_at, 'YYYYMMDD') || '-' || right(replace(o.id::text,'-',''), 6)) AS code,
      t.table_number,
      COALESCE(
          json_agg(
              json_build_object(
                  'id', oi.id,
                  'item_name', oi.item_name,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'subtotal', oi.subtotal,
                  'note', oi.note,
                  'status', oi.status
              )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) as items
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.table_id = $1
      AND o.payment_status <> 'paid'
      AND o.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY o.id, t.table_number
    ORDER BY o.created_at DESC
    LIMIT 10
  `;

  const result = await db.query(query, [tableId]);
  return result.rows;
};


exports.findUnpaidByUserId = async (userId, tableId, sessionId) => {
  const query = `
    SELECT * FROM orders
    WHERE user_id = $1
      AND table_id = $2
      AND payment_status = 'unpaid'
      AND session_id = $3
    ORDER BY created_at DESC
    LIMIT 1
  `;  
  const result = await db.query(query, [userId, tableId, sessionId]);
  return result.rows[0] || null;
}