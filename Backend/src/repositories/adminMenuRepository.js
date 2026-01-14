const db = require("../config/db");

function buildItemWhere({ q, categoryId, status, chef, includeDeleted }) {
  const where = [];
  const params = [];

  // default: hide deleted
  if (!includeDeleted) where.push(`mi.is_deleted = false`);

  if (categoryId && categoryId !== "ALL") {
    params.push(categoryId);
    where.push(`mi.category_id = $${params.length}`);
  }

  if (status && status !== "ALL") {
    params.push(status);
    where.push(`mi.status = $${params.length}`);
  }

  if (chef === "true" || chef === true) {
    where.push(`mi.is_chef_recommended = true`);
  }

  const qTrim = String(q || "").trim();
  if (qTrim) {
    params.push(`%${qTrim}%`);
    where.push(`(mi.name ILIKE $${params.length})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params };
}

function buildOrderBy(sort) {
  switch (sort) {
    case "PRICE_ASC":
      return `ORDER BY mi.price ASC, mi.created_at DESC`;
    case "PRICE_DESC":
      return `ORDER BY mi.price DESC, mi.created_at DESC`;
    case "NAME_ASC":
      return `ORDER BY mi.name ASC`;
    case "NAME_DESC":
      return `ORDER BY mi.name DESC`;
    case "OLDEST":
      return `ORDER BY mi.created_at ASC`;
    default:
      return `ORDER BY mi.created_at DESC`; // NEWEST
  }
}

async function listCategories({ status = "ALL" } = {}) {
  const where = [];
  const params = [];

  if (status && status !== "ALL") {
    params.push(status);
    where.push(`mc.status = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      mc.id,
      mc.name,
      mc.description,
      mc.display_order,
      mc.status,
      mc.created_at,
      mc.updated_at
    FROM menu_categories mc
    ${whereSql}
    ORDER BY mc.display_order ASC, mc.name ASC
  `;

  const result = await db.query(sql, params);
  return result.rows;
}

async function countItems(filters) {
  const { whereSql, params } = buildItemWhere(filters);

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM menu_items mi
    ${whereSql}
  `;

  const result = await db.query(sql, params);
  return result.rows[0]?.total ?? 0;
}

async function listItems(
  filters,
  { limit = 20, offset = 0, sort = "NEWEST" } = {}
) {
  const { whereSql, params } = buildItemWhere(filters);

  // ✅ POPULAR: join order_items + orders để tính sold_count
  const isPopular = sort === "POPULAR";

  const orderBy = (() => {
    switch (sort) {
      case "PRICE_ASC":
        return `ORDER BY mi.price ASC, mi.created_at DESC`;
      case "PRICE_DESC":
        return `ORDER BY mi.price DESC, mi.created_at DESC`;
      case "NAME_ASC":
        return `ORDER BY mi.name ASC`;
      case "NAME_DESC":
        return `ORDER BY mi.name DESC`;
      case "OLDEST":
        return `ORDER BY mi.created_at ASC`;
      case "POPULAR":
        return `ORDER BY sold_count DESC, mi.created_at DESC`;
      default:
        return `ORDER BY mi.created_at DESC`;
    }
  })();

  const sql = isPopular
    ? `
      SELECT
        mi.id,
        mi.category_id,
        mc.name AS category_name,
        mi.name,
        mi.description,
        mi.price,
        mi.prep_time_minutes,
        mi.status,
        mi.image_url,
        mi.is_chef_recommended,
        mi.is_deleted,
        mi.created_at,
        mi.updated_at,
        COALESCE(SUM(oi.quantity), 0)::int AS sold_count
      FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
      ${whereSql}
      GROUP BY mi.id, mc.name
      ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    : `
      SELECT
        mi.id,
        mi.category_id,
        mc.name AS category_name,
        mi.name,
        mi.description,
        mi.price,
        mi.prep_time_minutes,
        mi.status,
        mi.image_url,
        mi.is_chef_recommended,
        mi.is_deleted,
        mi.created_at,
        mi.updated_at,
        0::int AS sold_count
      FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      ${whereSql}
      ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

  const result = await db.query(sql, [...params, limit, offset]);
  console.log(result);
  return result.rows;
}

async function getItemById(id) {
  const sql = `
    SELECT
      mi.id,
      mi.category_id,
      mc.name AS category_name,
      mi.name,
      mi.description,
      mi.price,
      mi.prep_time_minutes,
      mi.status,
      mi.image_url,
      mi.is_chef_recommended,
      mi.is_deleted,
      mi.created_at,
      mi.updated_at
    FROM menu_items mi
    JOIN menu_categories mc ON mc.id = mi.category_id
    WHERE mi.id = $1
    LIMIT 1
  `;

  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

async function getModifierGroupIds(menuItemId) {
  const sql = `
    SELECT group_id
    FROM menu_item_modifier_groups
    WHERE menu_item_id = $1
    ORDER BY group_id ASC
  `;
  const result = await db.query(sql, [menuItemId]);
  return result.rows.map((r) => r.group_id);
}

async function createItem(payload) {
  const {
    categoryId,
    name,
    description = null,
    price,
    prepTimeMinutes = 0,
    status,
    imageUrl = null,
    isChefRecommended = false,
  } = payload;

  const sql = `
    INSERT INTO menu_items (
      category_id, name, description, price, prep_time_minutes,
      status, image_url, is_chef_recommended, is_deleted
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
    RETURNING id
  `;

  const result = await db.query(sql, [
    categoryId,
    name,
    description,
    price,
    prepTimeMinutes,
    status,
    imageUrl,
    isChefRecommended,
  ]);

  return result.rows[0];
}

async function updateItem(id, payload) {
  const fields = [];
  const params = [];

  const set = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };

  if (payload.categoryId != null) set("category_id", payload.categoryId);
  if (payload.name != null) set("name", payload.name);
  if (payload.description !== undefined)
    set("description", payload.description);
  if (payload.price != null) set("price", payload.price);
  if (payload.prepTimeMinutes != null)
    set("prep_time_minutes", payload.prepTimeMinutes);
  if (payload.status != null) set("status", payload.status);
  if (payload.imageUrl !== undefined) set("image_url", payload.imageUrl);
  if (payload.isChefRecommended != null)
    set("is_chef_recommended", payload.isChefRecommended);
  if (payload.isDeleted != null) set("is_deleted", payload.isDeleted);

  // always touch updated_at
  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) {
    // only updated_at -> still okay but pointless
  }

  const sql = `
    UPDATE menu_items
    SET ${fields.join(", ")}
    WHERE id = $${params.length + 1}
    RETURNING id
  `;
  params.push(id);

  const result = await db.query(sql, params);
  return result.rows[0] || null;
}

async function toggleChef(id, value) {
  const sql = `
    UPDATE menu_items
    SET is_chef_recommended = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, is_chef_recommended
  `;
  const result = await db.query(sql, [value, id]);
  return result.rows[0] || null;
}

async function softDeleteItem(id) {
  const sql = `
    UPDATE menu_items
    SET is_deleted = true, updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

async function findMenuItems({
  q,
  categoryId,
  status,
  chef,
  sort = "NEWEST",
  page = 1,
  limit = 20,
}) {
  const offset = (page - 1) * limit;

  let where = `WHERE mi.is_deleted = false`;
  const params = [];
  let idx = 1;

  if (q) {
    where += ` AND mi.name ILIKE $${idx++}`;
    params.push(`%${q}%`);
  }

  if (categoryId && categoryId !== "ALL") {
    where += ` AND mi.category_id = $${idx++}`;
    params.push(categoryId);
  }

  if (status && status !== "ALL") {
    where += ` AND mi.status = $${idx++}`;
    params.push(status);
  }

  if (chef === "true") {
    where += ` AND mi.is_chef_recommended = true`;
  }

  // ✅ SORT
  let orderBy = "mi.created_at DESC";

  switch (sort) {
    case "OLDEST":
      orderBy = "mi.created_at ASC";
      break;
    case "PRICE_ASC":
      orderBy = "mi.price ASC";
      break;
    case "PRICE_DESC":
      orderBy = "mi.price DESC";
      break;
    case "POPULAR":
      orderBy = "sold_count DESC NULLS LAST";
      break;
  }

  // ✅ query có popularity
  const dataQuery = `
    SELECT 
      mi.id,
      mi.name,
      mi.price,
      mi.status,
      mi.prep_time_minutes,
      mi.is_chef_recommended,
      mi.created_at,
      mc.name AS category_name,
      COALESCE(SUM(oi.quantity), 0) AS sold_count
    FROM menu_items mi
    JOIN menu_categories mc ON mc.id = mi.category_id
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
    ${where}
    GROUP BY mi.id, mc.name
    ORDER BY ${orderBy}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  params.push(limit, offset);

  const countQuery = `
    SELECT COUNT(*) FROM menu_items mi
    ${where}
  `;

  const [data, count] = await Promise.all([
    db.query(dataQuery, params),
    db.query(countQuery, params.slice(0, idx - 3)),
  ]);

  return {
    items: data.rows,
    total: Number(count.rows[0].count),
  };
}

async function createCategory({ name, description, displayOrder, status }) {
  const sql = `
    INSERT INTO menu_categories (name, description, display_order, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  const r = await db.query(sql, [name, description, displayOrder, status]);
  return r.rows[0];
}

async function hasItemInLockedOrders(menuItemId) {
  const sql = `
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.menu_item_id = $1
      AND o.status IN ('cancelled', 'completed')
    LIMIT 1
  `;
  const rs = await db.query(sql, [menuItemId]);
  return rs.rowCount > 0;
}

// ✅ soft delete (giữ data)
async function softDeleteItem(id) {
  const sql = `
    UPDATE menu_items
    SET is_deleted = true, updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;
  const rs = await db.query(sql, [id]);
  return rs.rows[0];
}

async function menuItemExists(menuItemId) {
  const { rows } = await db.query(
    `SELECT 1 FROM menu_items WHERE id = $1 LIMIT 1`,
    [menuItemId]
  );
  return rows.length > 0;
}

async function replaceMenuItemGroups(menuItemId, groupIds = []) {
  try {
    await db.query("BEGIN");

    // xoá mapping cũ
    await db.query(
      `DELETE FROM menu_item_modifier_groups WHERE menu_item_id = $1`,
      [menuItemId]
    );

    // insert mapping mới (nếu có)
    if (Array.isArray(groupIds) && groupIds.length) {
      await db.query(
        `
        INSERT INTO menu_item_modifier_groups (menu_item_id, group_id)
        SELECT $1, UNNEST($2::uuid[])
        `,
        [menuItemId, groupIds]
      );
    }

    await db.query("COMMIT");
    return true;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

module.exports = {
  listCategories,
  countItems,
  listItems,
  getItemById,
  getModifierGroupIds,
  createItem,
  updateItem,
  toggleChef,
  softDeleteItem,
  findMenuItems,
  createCategory,
  hasItemInLockedOrders,
  softDeleteItem,
  menuItemExists,
  replaceMenuItemGroups,
};
