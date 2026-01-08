const db = require('../config/db');

exports.getGroups = async (req, res) => {
  try {
    const query = `
      SELECT g.*, 
      COALESCE(json_agg(json_build_object('id', o.id, 'name', o.name, 'price', o.price_adjustment)) 
      FILTER (WHERE o.id IS NOT NULL), '[]') as options
      FROM modifier_groups g
      LEFT JOIN modifier_options o ON g.id = o.group_id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

exports.createGroup = async (req, res) => {
  const { name, selection_type, is_required } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO modifier_groups (name, selection_type, is_required)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, selection_type, is_required || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi tạo nhóm' });
  }
};

exports.addOption = async (req, res) => {
  const { group_id } = req.params;
  const { name, price } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO modifier_options (group_id, name, price_adjustment)
       VALUES ($1, $2, $3) RETURNING *`,
      [group_id, name, price || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi thêm tùy chọn' });
  }
};

exports.attachGroupToItem = async (req, res) => {
    const { item_id } = req.params;
    const { group_id } = req.body;
    try {
        await db.query(
            'INSERT INTO menu_item_modifier_groups (menu_item_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [item_id, group_id]
        );
        res.json({ message: 'Đã gắn modifier vào món' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi gắn modifier' });
    }
};