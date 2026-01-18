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
    WHERE o.status NOT IN ('pending', 'cancelled')
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

// tuỳ bạn: chỉ tính completed/paid
const ORDER_OK = [
  "completed",
  "COMPLETED",
  "ready",
  "READY",
  "preparing",
  "PREPARING",
];

exports.revenueAndOrders = async ({ from, to }) => {
  const { rows } = await db.query(
    `
    select 
      coalesce(sum(total_amount),0)::numeric as revenue,
      count(*)::int as orders
    from orders
    where created_at >= $1 and created_at < $2
      and lower(status) = any($3)
    `,
    [from, to, ORDER_OK.map((s) => s.toLowerCase())]
  );
  return rows[0];
};

exports.ordersDaily = async ({ from, to }) => {
  const { rows } = await db.query(
    `
    select
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
      count(*)::int as orders,
      coalesce(sum(total_amount),0)::numeric as revenue
    from orders
    where created_at >= $1 and created_at < $2
      and lower(status) = any($3)
    group by 1
    order by 1 asc
    `,
    [from, to, ORDER_OK.map((s) => s.toLowerCase())]
  );

  return rows.map((r) => ({
    date: r.date,
    orders: Number(r.orders) || 0,
    revenue: Number(r.revenue) || 0,
  }));
};

exports.peakHours = async ({ from, to }) => {
  const { rows } = await db.query(
    `
    select
      extract(hour from created_at)::int as hour,
      count(*)::int as orders
    from orders
    where created_at >= $1 and created_at < $2
      and lower(status) = any($3)
    group by 1
    order by 1 asc
    `,
    [from, to, ORDER_OK.map((s) => s.toLowerCase())]
  );

  // fill 0..23
  const map = new Map(rows.map((r) => [Number(r.hour), Number(r.orders)]));
  return Array.from({ length: 24 }).map((_, h) => ({
    hour: h,
    orders: map.get(h) || 0,
  }));
};

exports.popularItems = async ({ from, to, limit }) => {
  const { rows } = await db.query(
    `
    select
      oi.item_name as name,
      sum(oi.quantity)::int as quantity
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.created_at >= $1 and o.created_at < $2
      and lower(o.status) = any($3)
    group by 1
    order by 2 desc
    limit $4
    `,
    [from, to, ORDER_OK.map((s) => s.toLowerCase()), limit]
  );

  return rows.map((r) => ({ name: r.name, quantity: Number(r.quantity) || 0 }));
};

exports.getRevenue = async ({
  fromISO,
  toISO,
  statuses = ["completed"],
  paymentStatus = "paid",
}) => {
  const sql = `
    SELECT COALESCE(SUM(o.total_amount), 0) AS total
    FROM orders o
    WHERE o.payment_status = $3
      AND o.status = ANY($4::text[])
      AND o.created_at >= $1
      AND o.created_at <  $2
  `;

  const values = [
    typeof fromISO === "string" ? fromISO : new Date(fromISO).toISOString(),
    typeof toISO === "string" ? toISO : new Date(toISO).toISOString(),
    paymentStatus,
    statuses,
  ];

  const { rows } = await db.query(sql, values);
  return Number(rows?.[0]?.total || 0);
};
