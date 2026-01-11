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
  const { rows } = await db.query(`SELECT COUNT(*)::int AS count FROM tables`);
  return rows[0].count;
};

exports.countUsers = async () => {
  const { rows } = await db.query(`SELECT COUNT(*)::int AS count FROM users`);
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
      mi.category,
      COALESCE(SUM(oi.quantity), 0)::int AS orders
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid','completed','done')
      AND date_trunc('month', o.created_at) = date_trunc('month', NOW())
    GROUP BY mi.id, mi.name, mi.category
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
      category,
      COALESCE(avg_rating, 0)::float AS rating,
      COALESCE(rating_count, 0)::int AS reviews
    FROM menu_items
    WHERE COALESCE(rating_count, 0) > 0
    ORDER BY avg_rating DESC, rating_count DESC
    LIMIT $1
  `,
    [limit]
  );
  return rows;
};
