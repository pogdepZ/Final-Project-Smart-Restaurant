const db = require("../config/db");

function buildCategoryWhere({ status, includeDeleted } = {}) {
  const where = [];
  const params = [];

  // default: hide deleted
  if (!includeDeleted) where.push(`mc.is_deleted = false`);

  if (status && status !== "ALL") {
    params.push(status);
    where.push(`mc.status = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params };
}

exports.list = async ({ status = "ALL", includeDeleted = false } = {}) => {
  const { whereSql, params } = buildCategoryWhere({ status, includeDeleted });

  const sql = `
    SELECT
      mc.id,
      mc.name,
      mc.description,
      mc.display_order,
      mc.status,
      mc.is_deleted,
      mc.created_at,
      mc.updated_at
    FROM menu_categories mc
    ${whereSql}
    ORDER BY mc.display_order ASC, mc.name ASC
  `;

  const result = await db.query(sql, params);
  return result.rows;
};

exports.create = async ({
  name,
  description = null,
  displayOrder = 0,
  status = "active",
}) => {
  const sql = `
    INSERT INTO menu_categories (name, description, display_order, status, is_deleted)
    VALUES ($1, $2, $3, $4, false)
    RETURNING *
  `;
  const r = await db.query(sql, [name, description, displayOrder, status]);
  return r.rows[0];
};

exports.updateById = async (id, payload) => {
  const fields = [];
  const params = [];

  const set = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };

  if (payload.name != null) set("name", payload.name);
  if (payload.description !== undefined)
    set("description", payload.description);
  if (payload.displayOrder != null) set("display_order", payload.displayOrder);
  if (payload.status != null) set("status", payload.status);
  if (payload.isDeleted != null) set("is_deleted", payload.isDeleted);

  fields.push(`updated_at = NOW()`);

  const sql = `
    UPDATE menu_categories
    SET ${fields.join(", ")}
    WHERE id = $${params.length + 1}
    RETURNING *
  `;
  params.push(id);

  const r = await db.query(sql, params);
  return r.rows[0] || null;
};

exports.softDeleteById = async (id) => {
  const sql = `
    UPDATE menu_categories
    SET is_deleted = true, updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;
  const r = await db.query(sql, [id]);
  return r.rows[0] || null;
};

exports.restoreById = async (id) => {
  const sql = `
    UPDATE menu_categories
    SET is_deleted = false, updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;
  const r = await db.query(sql, [id]);
  return r.rows[0] || null;
};

/**
 * ✅ Check category có xuất hiện trong order chưa completed không
 * menu_categories -> menu_items -> order_items -> orders
 */
exports.hasActiveOrders = async (categoryId) => {
  const sql = `
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE mi.category_id = $1
      AND COALESCE(o.status, '') <> 'completed'
    LIMIT 1
  `;
  const rs = await db.query(sql, [categoryId]);
  return rs.rowCount > 0;
};

/** (Khuyến nghị) chặn xoá nếu category còn menu_items */
exports.hasMenuItems = async (categoryId) => {
  const rs = await db.query(
    `SELECT 1 FROM menu_items WHERE category_id = $1 AND is_deleted = false LIMIT 1`,
    [categoryId],
  );
  return rs.rowCount > 0;
};

exports.existsActive = async (id) => {
  const rs = await db.query(
    `SELECT 1 FROM menu_categories WHERE id=$1 AND is_deleted=false LIMIT 1`,
    [id],
  );
  return rs.rowCount > 0;
};
