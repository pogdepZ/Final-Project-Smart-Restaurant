const db = require('../config/db');

// Lấy danh sách Groups (Kèm options) để hiển thị Admin UI
exports.getGroups = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT g.*, 
            COALESCE(json_agg(json_build_object('id', o.id, 'name', o.name, 'price', o.price_adjustment, 'status', o.status)) 
            FILTER (WHERE o.id IS NOT NULL), '[]') as options
            FROM modifier_groups g
            LEFT JOIN modifier_options o ON g.id = o.group_id
            GROUP BY g.id
            ORDER BY g.display_order ASC, g.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ message: "Lỗi tải danh sách" });
    }
};

// Tạo nhóm mới
exports.createGroup = async (req, res) => {
  const { name, selection_type, is_required, min_selections, max_selections, display_order } = req.body;

  // VALIDATION LOGIC
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: "Tên nhóm là bắt buộc" });
  }

  if (!['single', 'multiple'].includes(selection_type)) {
    return res.status(400).json({ message: "Kiểu chọn phải là 'single' hoặc 'multiple'" });
  }

  // Logic validate Min/Max theo yêu cầu đề bài
  let finalMin = parseInt(min_selections) || 0;
  let finalMax = parseInt(max_selections) || 0;

  if (selection_type === 'single') {
    // Nếu single-select: luôn chọn 1 cái (nếu required) hoặc 0-1 cái (nếu optional)
    finalMax = 1; 
    finalMin = is_required ? 1 : 0;
  } else {
    // Nếu multi-select
    if (is_required && finalMin < 1) {
        // "multi-select must respect min" -> Nếu bắt buộc thì min ít nhất là 1
        return res.status(400).json({ message: "Nếu bắt buộc, số lượng tối thiểu phải >= 1" });
    }
    if (finalMax > 0 && finalMax < finalMin) {
        return res.status(400).json({ message: "Số lượng tối đa phải lớn hơn tối thiểu" });
    }
  }

  try {
    const result = await db.query(
      `INSERT INTO modifier_groups 
      (name, selection_type, is_required, min_selections, max_selections, display_order) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, selection_type, is_required || false, finalMin, finalMax, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi tạo nhóm modifier' });
  }
};

// Thêm tùy chọn (Option) vào nhóm
exports.addOption = async (req, res) => {
  const { group_id } = req.params;
  const { name, price_adjustment, status } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: "Tên tùy chọn là bắt buộc" });
  }

  const price = Number(price_adjustment);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ message: "Giá cộng thêm phải >= 0" });
  }

  try {
    // Kiểm tra Group tồn tại
    const groupCheck = await db.query('SELECT id FROM modifier_groups WHERE id = $1', [group_id]);
    if(groupCheck.rows.length === 0) return res.status(404).json({ message: "Nhóm không tồn tại" });

    const result = await db.query(
      `INSERT INTO modifier_options (group_id, name, price_adjustment, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [group_id, name, price, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi thêm tùy chọn' });
  }
};

// Cập nhật nhóm (Sửa tên, config...)
exports.updateGroup = async (req, res) => {
    const { id } = req.params;
    const { name, selection_type, is_required, min_selections, max_selections, status } = req.body;
    try {
        const result = await db.query(
            `UPDATE modifier_groups SET
             name = COALESCE($1, name),
             selection_type = COALESCE($2, selection_type),
             is_required = COALESCE($3, is_required),
             min_selections = COALESCE($4, min_selections),
             max_selections = COALESCE($5, max_selections),
             status = COALESCE($6, status)
             WHERE id = $7 RETURNING *`,
            [name, selection_type, is_required, min_selections, max_selections, status, id]
        );
        res.json(result.rows[0]);
    } catch(err) {
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
};

// --- 4.3 Attach Modifiers to Items ---
exports.attachGroupToItem = async (req, res) => {
    const { item_id } = req.params;
    const { group_id } = req.body;

    try {
        // Sử dụng ON CONFLICT DO NOTHING để tránh lỗi trùng lặp nếu frontend lỡ gửi 2 lần
        // Lưu ý: bảng menu_item_modifier_groups cần có constraint UNIQUE(menu_item_id, group_id) - (đã có Primary Key đôi rồi)
        await db.query(
            `INSERT INTO menu_item_modifier_groups (menu_item_id, group_id) 
             VALUES ($1, $2) 
             ON CONFLICT (menu_item_id, group_id) DO NOTHING`,
            [item_id, group_id]
        );
        res.json({ message: 'Đã gắn nhóm modifier vào món thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi gắn modifier (Kiểm tra lại ID)' });
    }
};