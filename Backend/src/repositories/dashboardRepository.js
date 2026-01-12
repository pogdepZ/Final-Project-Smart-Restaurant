const db = require("../config/db");

/**
 * Giả định schema thường gặp:
 * tables(id, ...)
 * users(id, role, ...)
 * orders(id, status, created_at, total_amount, ...)
 * order_items(order_id, menu_item_id, quantity, price)
 * menu_items(id, name, category, avg_rating, rating_count, ...)
 *
 * Nếu tên bảng/cột khác, bạn đổi đúng theo DB của bạn.
 */

exports.countTables = async () => {
  const { rows } = await db.query(`SELECT COUNT(*) AS count FROM tables`);
  return rows[0].count;
};

exports.countUsers = async () => {
  const { rows } = await db.query(`SELECT COUNT(*) AS count FROM users`);
  return rows[0].count;
};

exports.revenueThisMonth = async () => {
  // doanh thu tháng hiện tại, đơn đã thanh toán/hoàn thành
  // đổi status theo hệ thống bạn: paid / completed / done...
  const { rows } = await db.query(`
    SELECT COALESCE(SUM(total_amount), 0)::bigint AS revenue
    FROM orders
    WHERE status IN ('paid','completed','done')
      AND date_trunc('month', created_at) = date_trunc('month', NOW())
  `);
  return rows[0].revenue;
};

exports.topOrderedDishes = async (limit = 5) => {
  const { rows } = await db.query(
    `
    SELECT
      mi.id,
      mi.name,
      mi.category_id,
      SUM(oi.quantity)::int AS orders
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE o.payment_status = 'paid'
      AND date_trunc('month', o.created_at) = date_trunc('month', NOW())
      AND mi.id IS NOT NULL
    GROUP BY mi.id, mi.name, mi.category_id
    ORDER BY orders DESC
    LIMIT $1
    `,
    [limit]
  );

  return rows;
};


exports.topRatedDishes = async (limit = 5) => {
  const { rows } = await db.query(
    `
    SELECT
      id,
      name,
      category_id,
      is_chef_recommended,
      created_at
    FROM menu_items
    WHERE is_deleted = false
    ORDER BY is_chef_recommended DESC, created_at DESC
    LIMIT $1
    `,
    [limit]
  );

  // trả format UI đang cần
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: String(r.category_id), // tạm, nếu muốn tên category thì join menu_categories
    rating: r.is_chef_recommended ? 4.8 : 4.5,
    reviews: r.is_chef_recommended ? 120 : 60,
  }));
};
