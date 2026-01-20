const db = require("../config/db");

// ===== CATEGORIES =====
exports.findAllCategories = async () => {
  const sql = "SELECT * FROM menu_categories ORDER BY display_order ASC";
  const result = await db.query(sql);
  return result.rows;
};

exports.insertCategory = async ({
  name,
  description,
  display_order,
  status,
}) => {
  const sql = `
    INSERT INTO menu_categories (name, description, display_order, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query(sql, [
    name,
    description,
    display_order,
    status,
  ]);
  return result.rows[0];
};

exports.updateCategoryById = async (id, patch) => {
  const sql = `
    UPDATE menu_categories SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      display_order = COALESCE($3, display_order),
      status = COALESCE($4, status),
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `;
  const result = await db.query(sql, [
    patch.name,
    patch.description,
    patch.display_order,
    patch.status,
    id,
  ]);
  return result.rows[0] || null;
};

exports.findCategoryId = async (id) => {
  const result = await db.query(
    "SELECT id FROM menu_categories WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
};

// ===== MENU ITEMS =====
exports.findMenuItemsAdmin = async ({
  category_id,
  status,
  search,
  sort,
  limit,
  offset,
}) => {
  const params = [];
  let sql = `
    SELECT i.id, i.category_id, i.name, i.description, i.price, 
           i.prep_time_minutes, i.status, i.is_chef_recommended, 
           i.created_at, i.updated_at, i.is_deleted,
           p.url AS image_url, c.name AS category_name
    FROM menu_items i
    LEFT JOIN menu_categories c ON i.category_id = c.id
    LEFT JOIN menu_item_photos p 
      ON p.menu_item_id = i.id 
     AND p.is_primary = true
    WHERE i.is_deleted = false
  `;

  if (category_id) {
    params.push(category_id);
    sql += ` AND i.category_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    sql += ` AND i.status = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND i.name ILIKE $${params.length}`;
  }

  switch (sort) {
    case "price_asc":
      sql += " ORDER BY i.price ASC";
      break;
    case "price_desc":
      sql += " ORDER BY i.price DESC";
      break;
    case "name_asc":
      sql += " ORDER BY i.name ASC";
      break;
    default:
      sql += " ORDER BY i.created_at DESC";
  }

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  sql += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  params.push(limit, offset);

  const result = await db.query(sql, params);
  return result.rows;
};

exports.findMenuItemById = async (id) => {
  const sql = `
    SELECT mi.*, p.url AS image_url
    FROM menu_items mi
    LEFT JOIN menu_item_photos p 
      ON p.menu_item_id = mi.id 
     AND p.is_primary = true
    WHERE mi.id = $1
  `;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
};

exports.findModifierGroupsByMenuItemId = async (menuItemId) => {
  const sql = `
    SELECT 
      g.id, g.name, g.selection_type, g.is_required,
      COALESCE(
        json_agg(
          json_build_object('id', o.id, 'name', o.name, 'price', o.price_adjustment)
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'
      ) AS options
    FROM menu_item_modifier_groups link
    JOIN modifier_groups g ON link.group_id = g.id
    LEFT JOIN modifier_options o ON g.id = o.group_id
    WHERE link.menu_item_id = $1
    GROUP BY g.id
  `;
  const result = await db.query(sql, [menuItemId]);
  return result.rows;
};

exports.insertMenuItem = async (data) => {
  const sql = `
    INSERT INTO menu_items
      (category_id, name, description, price, prep_time_minutes, status, is_chef_recommended)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const result = await db.query(sql, [
    data.category_id,
    data.name,
    data.description,
    data.price,
    data.prep_time_minutes,
    data.status,
    data.is_chef_recommended,
  ]);
  return result.rows[0];
};

exports.updateMenuItemById = async (id, fields, values) => {
  // fields: ["name = $1", "price = $2", ... , "updated_at = NOW()"]
  // values: [.., id]
  const sql = `UPDATE menu_items SET ${fields.join(", ")} WHERE id = $${
    values.length
  } RETURNING *`;
  const result = await db.query(sql, values);
  return result.rows[0] || null;
};

exports.softDeleteMenuItem = async (id) => {
  await db.query("UPDATE menu_items SET is_deleted = true WHERE id = $1", [id]);
};

exports.insertMenuItemPhoto = async (menuItemId, url, isPrimary = false) => {
  await db.query(
    "INSERT INTO menu_item_photos (menu_item_id, url, is_primary) VALUES ($1, $2, $3)",
    [menuItemId, url, isPrimary],
  );
};

exports.findGuestMenu = async () => {
  const sql = `
    SELECT i.id, i.category_id, i.name, i.description, i.price, 
           i.prep_time_minutes, i.status, i.is_chef_recommended, 
           i.created_at, i.updated_at, i.is_deleted,
           p.url AS image_url, c.name as category_name
    FROM menu_items i
    JOIN menu_categories c ON i.category_id = c.id
    LEFT JOIN menu_item_photos p 
      ON p.menu_item_id = i.id 
     AND p.is_primary = true
    WHERE i.is_deleted = false
      AND i.status = 'available'
      AND c.status = 'active'
    ORDER BY c.display_order ASC, i.name ASC
  `;
  const result = await db.query(sql);
  return result.rows;
};

exports.findRelatedItemsByCategory = async (categoryId, excludeId) => {
  // POSTGRESQL: Dùng $1, $2 thay vì ?
  const sql = `
    SELECT mi.id, mi.name, mi.price, p.url AS image_url 
    FROM menu_items mi
    LEFT JOIN menu_item_photos p 
      ON p.menu_item_id = mi.id 
     AND p.is_primary = true
    WHERE mi.category_id = $1 AND mi.id != $2
    LIMIT 5
  `;

  // $1 sẽ nhận categoryId, $2 sẽ nhận excludeId
  const result = await db.query(sql, [categoryId, excludeId]);

  // Lưu ý: thư viện 'pg' thường trả về object có thuộc tính .rows
  return result.rows || result;
};

exports.findMenuItemsPublic = async ({
  category_id,
  search,
  sort,
  limit,
  offset,
  chef,
}) => {
  const params = [];
  let where = `WHERE i.is_deleted = false`;

  if (category_id) {
    params.push(category_id);
    where += ` AND i.category_id = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    where += ` AND i.name ILIKE $${params.length}`;
  }

  // popularity: tổng quantity trong order_items
  // NOTE: nếu bạn chỉ muốn tính đơn COMPLETED/DELIVERED thì join thêm orders và filter status
  let orderBy = `ORDER BY i.created_at DESC`;
  if (sort === "popularity") {
    orderBy = `ORDER BY total_ordered DESC NULLS LAST, i.created_at DESC`;
  }

  if (chef === true || chef === "1" || chef === 1) {
    where += ` AND i.is_chef_recommended = true`;
  }

  const listSql = `
    SELECT 
      i.id, i.category_id, i.name, i.description, i.price,
      i.status, p.url AS image_url, i.is_chef_recommended,
      i.created_at,
      c.name AS category_name,
      COALESCE(SUM(oi.quantity), 0)::int AS total_ordered
    FROM menu_items i
    JOIN menu_categories c ON c.id = i.category_id
    LEFT JOIN menu_item_photos p 
      ON p.menu_item_id = i.id 
     AND p.is_primary = true
    LEFT JOIN order_items oi ON oi.menu_item_id = i.id AND oi.status != 'rejected'
    ${where}
    GROUP BY i.id, c.name, p.url
    ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const rows = (await db.query(listSql, [...params, limit, offset])).rows;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM menu_items i
    ${where}
  `;
  const total = (await db.query(countSql, params)).rows[0]?.total ?? 0;

  return { rows, total };
};

exports.getItemById = async (id) => {
  // Lấy thông tin món ăn theo ID
  const sql = `
    SELECT mi.*, p.url AS image_url
    FROM menu_items mi
    LEFT JOIN menu_item_photos p 
      ON p.menu_item_id = mi.id 
     AND p.is_primary = true
    WHERE mi.id = $1
  `;
  const result = await db.query(sql, [id]);
  return result.rows[0];
};

exports.findTopChefBestSeller = async (limit) => {
  const sql = `
    SELECT
      mi.id,
      mi.name,
      mi.description,
      mi.price,
      mi.category_id,
      mi.is_chef_recommended,
      COALESCE(SUM(oi.quantity), 0) AS sold_qty,
      p.url AS image_url
    FROM menu_items mi

    -- ảnh primary
    LEFT JOIN menu_item_photos p 
      ON p.menu_item_id = mi.id
     AND p.is_primary = true

    -- thống kê bán
    JOIN order_items oi 
      ON oi.menu_item_id = mi.id
    JOIN orders o 
      ON o.id = oi.order_id
     AND o.payment_status = 'paid'   -- ⚠️ đổi cho đúng field hệ thống bạn

    WHERE
      mi.is_deleted = false
      AND mi.status = 'available'
      AND mi.is_chef_recommended = true

    GROUP BY mi.id, p.url
    ORDER BY sold_qty DESC, mi.updated_at DESC
    LIMIT $1;
  `;

  const { rows } = await db.query(sql, [limit]);
  return rows;
};