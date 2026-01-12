const db = require('../config/db');

// ===== CATEGORIES =====
exports.findAllCategories = async () => {
  const sql = 'SELECT * FROM menu_categories ORDER BY display_order ASC';
  const result = await db.query(sql);
  return result.rows;
};

exports.insertCategory = async ({ name, description, display_order, status }) => {
  const sql = `
    INSERT INTO menu_categories (name, description, display_order, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query(sql, [name, description, display_order, status]);
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
  const result = await db.query('SELECT id FROM menu_categories WHERE id = $1', [id]);
  return result.rows[0] || null;
};

// ===== MENU ITEMS =====
exports.findMenuItemsAdmin = async ({ category_id, status, search, sort, limit, offset }) => {
  const params = [];
  let sql = `
    SELECT i.*, c.name AS category_name
    FROM menu_items i
    LEFT JOIN menu_categories c ON i.category_id = c.id
    WHERE i.is_deleted = false
  `;

  if (category_id) { params.push(category_id); sql += ` AND i.category_id = $${params.length}`; }
  if (status) { params.push(status); sql += ` AND i.status = $${params.length}`; }
  if (search) { params.push(`%${search}%`); sql += ` AND i.name ILIKE $${params.length}`; }

  switch (sort) {
    case 'price_asc': sql += ' ORDER BY i.price ASC'; break;
    case 'price_desc': sql += ' ORDER BY i.price DESC'; break;
    case 'name_asc': sql += ' ORDER BY i.name ASC'; break;
    default: sql += ' ORDER BY i.created_at DESC';
  }

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  sql += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  params.push(limit, offset);

  const result = await db.query(sql, params);
  return result.rows;
};

exports.findMenuItemById = async (id) => {
  const result = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
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
      (category_id, name, description, price, prep_time_minutes, status, image_url, is_chef_recommended)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;
  const result = await db.query(sql, [
    data.category_id,
    data.name,
    data.description,
    data.price,
    data.prep_time_minutes,
    data.status,
    data.image_url,
    data.is_chef_recommended,
  ]);
  return result.rows[0];
};

exports.updateMenuItemById = async (id, fields, values) => {
  // fields: ["name = $1", "price = $2", ... , "updated_at = NOW()"]
  // values: [.., id]
  const sql = `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
  const result = await db.query(sql, values);
  return result.rows[0] || null;
};

exports.softDeleteMenuItem = async (id) => {
  await db.query('UPDATE menu_items SET is_deleted = true WHERE id = $1', [id]);
};

exports.insertMenuItemPhoto = async (menuItemId, url) => {
  await db.query(
    'INSERT INTO menu_item_photos (menu_item_id, url) VALUES ($1, $2)',
    [menuItemId, url]
  );
};

exports.findGuestMenu = async () => {
  const sql = `
    SELECT i.*, c.name as category_name
    FROM menu_items i
    JOIN menu_categories c ON i.category_id = c.id
    WHERE i.is_deleted = false
      AND i.status = 'available'
      AND c.status = 'active'
    ORDER BY c.display_order ASC, i.name ASC
  `;
  const result = await db.query(sql);
  return result.rows;
};
