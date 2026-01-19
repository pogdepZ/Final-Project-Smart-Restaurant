// src/repositories/adminOrderRepository.js
const db = require("../config/db");

/**
 * Helper: build WHERE + params (dynamic)
 * - If `statuses` is provided (array) -> filter by group (priority)
 * - Else if `status` != "ALL" -> filter by single status
 * - from/to: filter by date (YYYY-MM-DD) inclusive on day, using [from, to+1day)
 * - q: search by computed order code: ORD-YYYYMMDD-XXXXXX
 */
function buildWhere({ q, status, statuses, from, to } = {}) {
  const where = [];
  const params = [];

  // ✅ group statuses has priority
  if (Array.isArray(statuses) && statuses.length) {
    params.push(statuses.map((s) => String(s).toLowerCase()));
    where.push(`lower(o.status) = ANY($${params.length}::text[])`);
  } else if (status && status !== "ALL") {
    params.push(status);
    where.push(`o.status = $${params.length}`);
  }

  // from (>= from date at 00:00)
  if (from) {
    params.push(from);
    where.push(`o.created_at >= ($${params.length}::date)`);
  }

  // to (< to + 1 day)
  if (to) {
    params.push(to);
    where.push(`o.created_at < (($${params.length}::date) + interval '1 day')`);
  }

  // search by computed code
  const qTrim = String(q || "").trim();
  if (qTrim) {
    params.push(`%${qTrim}%`);
    where.push(`
      (
        ('ORD-' || to_char(o.created_at, 'YYYYMMDD') || '-' || right(replace(o.id::text,'-',''), 6))
        ILIKE $${params.length}
      )
    `);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params };
}

async function countOrders(filters = {}) {
  const { whereSql, params } = buildWhere(filters);

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM orders o
    ${whereSql}
  `;

  const result = await db.query(sql, params);
  return result.rows[0]?.total ?? 0;
}

/**
 * Find orders with pagination
 * NOTE: use parameterized LIMIT/OFFSET for safety
 */
async function findOrders(filters = {}, { limit = 20, offset = 0 } = {}) {
  const { whereSql, params } = buildWhere(filters);

  const sql = `
    SELECT
      o.id,
      o.table_id,
      o.user_id,
      o.guest_name,
      o.total_amount,
      o.status,
      o.payment_status,
      o.note,
      o.created_at,
      o.updated_at,
      ('ORD-' || to_char(o.created_at, 'YYYYMMDD') || '-' || right(replace(o.id::text,'-',''), 6)) AS code,
      COALESCE(oi.total_items, 0)::int AS total_items
    FROM orders o
    LEFT JOIN (
      SELECT order_id, SUM(quantity) AS total_items
      FROM order_items
      GROUP BY order_id
    ) oi ON oi.order_id = o.id
    ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const result = await db.query(sql, [
    ...params,
    Number(limit) || 20,
    Number(offset) || 0,
  ]);
  return result.rows;
}

async function findOrderById(orderId) {
  const sql = `
    SELECT
      o.id,
      o.table_id,
      t.table_number AS table_name,          -- ✅ tên bàn
      t.location AS table_location,          -- (optional)
      t.capacity AS table_capacity,          -- (optional)

      o.user_id,
      o.guest_name,
      o.total_amount,
      o.status,
      o.payment_status,
      o.note,
      o.created_at,
      o.updated_at,

      ('ORD-' || to_char(o.created_at, 'YYYYMMDD') || '-' || right(replace(o.id::text,'-',''), 6)) AS code,
      COALESCE(oi.total_items, 0)::int AS total_items

    FROM orders o
    LEFT JOIN public.tables t ON t.id = o.table_id   -- ✅ join tables
    LEFT JOIN (
      SELECT order_id, SUM(quantity) AS total_items
      FROM order_items
      GROUP BY order_id
    ) oi ON oi.order_id = o.id

    WHERE o.id = $1
    LIMIT 1
  `;

  const result = await db.query(sql, [orderId]);
  return result.rows[0] || null;
}

async function findOrderItems(orderId) {
  const sql = `
    SELECT
      id,
      order_id,
      menu_item_id,
      item_name,
      price,
      quantity,
      subtotal,
      status,
      note
    FROM order_items
    WHERE order_id = $1
    ORDER BY id ASC
  `;

  const result = await db.query(sql, [orderId]);
  return result.rows;
}

module.exports = {
  countOrders,
  findOrders,
  findOrderById,
  findOrderItems,
};
