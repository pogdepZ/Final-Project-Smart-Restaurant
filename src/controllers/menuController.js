const db = require("../config/db");

// --- CATEGORIES ---
exports.getCategories = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM menu_categories ORDER BY display_order ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

exports.createCategory = async (req, res) => {
  const { name, description, display_order } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO menu_categories (name, description, display_order) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tạo danh mục (Tên có thể bị trùng)" });
  }
};

// --- ITEMS ---
exports.getMenuItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100, // Mặc định lấy 100 món
      search = "",
      category_id,
      status,
      sort = "newest",
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let query = `
            SELECT i.*, c.name as category_name 
            FROM menu_items i
            LEFT JOIN menu_categories c ON i.category_id = c.id
            WHERE i.is_deleted = false
        `;

    if (category_id) {
      params.push(category_id);
      query += ` AND i.category_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND i.name ILIKE $${params.length}`;
    }

    // Sort
    switch (sort) {
      case "price_asc":
        query += ` ORDER BY i.price ASC`;
        break;
      case "price_desc":
        query += ` ORDER BY i.price DESC`;
        break;
      case "name_asc":
        query += ` ORDER BY i.name ASC`;
        break;
      case "oldest":
        query += ` ORDER BY i.created_at ASC`;
        break;
      default:
        query += ` ORDER BY i.created_at DESC`; // newest
    }

    // Pagination
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    query += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    query += ` ORDER BY i.created_at DESC`;

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// 2. Lấy chi tiết 1 món (Kèm theo Modifier Groups đã gắn) - QUAN TRỌNG
exports.getMenuItemById = async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy thông tin món
        const itemRes = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
        if (itemRes.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy món" });

        const item = itemRes.rows[0];

        // Lấy danh sách Modifier Groups gắn với món này
        // Kèm theo cả options của group đó
        const modifiersQuery = `
            SELECT g.id, g.name, g.selection_type, g.is_required,
            COALESCE(json_agg(json_build_object('id', o.id, 'name', o.name, 'price', o.price_adjustment)) 
            FILTER (WHERE o.id IS NOT NULL), '[]') as options
            FROM menu_item_modifier_groups link
            JOIN modifier_groups g ON link.group_id = g.id
            LEFT JOIN modifier_options o ON g.id = o.group_id
            WHERE link.menu_item_id = $1
            GROUP BY g.id
        `;
        const modRes = await db.query(modifiersQuery, [id]);
        
        item.modifier_groups = modRes.rows; // Gắn vào object trả về

        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy chi tiết món' });
    }
};

exports.createMenuItem = async (req, res) => {
  const { category_id, name, description, price, prep_time_minutes } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  try {
    const result = await db.query(
      `INSERT INTO menu_items 
      (category_id, name, description, price, prep_time_minutes, image_url) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [category_id, name, description, price, prep_time_minutes || 15, imageUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tạo món ăn" });
  }
};


// 4. Cập nhật món (PUT) - Có xử lý ảnh mới
exports.updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category_id, status, prep_time_minutes, is_chef_recommended } = req.body;
    const imageUrl = req.file ? req.file.path : undefined; // Nếu không up ảnh mới thì là undefined

    try {
        // Xây dựng câu query động (chỉ update trường nào được gửi lên)
        // Tuy nhiên để đơn giản cho bài tập, ta dùng COALESCE (giữ giá trị cũ nếu null)
        // Lưu ý: Nếu user gửi chuỗi rỗng "", COALESCE vẫn lấy chuỗi rỗng.
        
        let query = `
            UPDATE menu_items SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            price = COALESCE($3, price),
            category_id = COALESCE($4, category_id),
            status = COALESCE($5, status),
            prep_time_minutes = COALESCE($6, prep_time_minutes),
            is_chef_recommended = COALESCE($7, is_chef_recommended),
            updated_at = NOW()
        `;
        
        const params = [name, description, price, category_id, status, prep_time_minutes, is_chef_recommended];
        
        // Nếu có ảnh mới thì update, không thì giữ nguyên
        if (imageUrl) {
            query += `, image_url = $${params.length + 1}`;
            params.push(imageUrl);
        }

        query += ` WHERE id = $${params.length + 1} RETURNING *`;
        params.push(id);

        const result = await db.query(query, params);

        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy món" });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi cập nhật món' });
    }
};

exports.deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE menu_items SET is_deleted = true WHERE id = $1", [
      id,
    ]);
    res.json({ message: "Đã xóa món ăn" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi xóa món" });
  }
};
