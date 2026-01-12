const db = require("../config/db");

class ModifierRepository {
  // Lấy danh sách Groups + Options
  async getAllWithOptions() {
    const result = await db.query(`
            SELECT g.*, 
            COALESCE(json_agg(json_build_object('id', o.id, 'name', o.name, 'price', o.price_adjustment, 'status', o.status)) 
            FILTER (WHERE o.id IS NOT NULL), '[]') as options
            FROM modifier_groups g
            LEFT JOIN modifier_options o ON g.id = o.group_id
            GROUP BY g.id
            ORDER BY g.display_order ASC, g.created_at DESC
        `);
    return result.rows;
  }

  // Tạo Group
  async createGroup({
    name,
    selection_type,
    is_required,
    min_selections,
    max_selections,
    display_order,
  }) {
    const result = await db.query(
      `INSERT INTO modifier_groups 
            (name, selection_type, is_required, min_selections, max_selections, display_order) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        name,
        selection_type,
        is_required,
        min_selections,
        max_selections,
        display_order,
      ]
    );
    return result.rows[0];
  }

  // Cập nhật Group
  async updateGroup(
    id,
    {
      name,
      selection_type,
      is_required,
      min_selections,
      max_selections,
      status,
    }
  ) {
    const result = await db.query(
      `UPDATE modifier_groups SET
             name = COALESCE($1, name),
             selection_type = COALESCE($2, selection_type),
             is_required = COALESCE($3, is_required),
             min_selections = COALESCE($4, min_selections),
             max_selections = COALESCE($5, max_selections),
             status = COALESCE($6, status)
             WHERE id = $7 RETURNING *`,
      [
        name,
        selection_type,
        is_required,
        min_selections,
        max_selections,
        status,
        id,
      ]
    );
    return result.rows[0];
  }

  // Kiểm tra Group tồn tại
  async findGroupById(id) {
    const result = await db.query(
      "SELECT id FROM modifier_groups WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }

  // Tạo Option
  async createOption({ group_id, name, price, status }) {
    const result = await db.query(
      `INSERT INTO modifier_options (group_id, name, price_adjustment, status) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
      [group_id, name, price, status]
    );
    return result.rows[0];
  }

  // Gắn Group vào Món ăn
  async attachToItem(item_id, group_id) {
    await db.query(
      `INSERT INTO menu_item_modifier_groups (menu_item_id, group_id) 
             VALUES ($1, $2) 
             ON CONFLICT (menu_item_id, group_id) DO NOTHING`,
      [item_id, group_id]
    );
  }
}

module.exports = new ModifierRepository();
