const db = require('../config/db');

// --- 1. CATEGORIES (DANH MỤC) ---

// Lấy danh sách danh mục
exports.getCategories = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM menu_categories ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

// Tạo danh mục
exports.createCategory = async (req, res) => {
  const { name, description, display_order, status } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO menu_categories (name, description, display_order, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, display_order || 0, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    console.error(err);
    res.status(500).json({ message: 'Lỗi tạo danh mục' });
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, display_order, status } = req.body;
  try {
    const result = await db.query(
        `UPDATE menu_categories SET 
         name = COALESCE($1, name), description = COALESCE($2, description),
         display_order = COALESCE($3, display_order), status = COALESCE($4, status),
         updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [name, description, display_order, status, id]
    );
    if(result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật' });
  }
};

// --- 2. MENU ITEMS (MÓN ĂN) ---

// Lấy danh sách món (Admin - Hỗ trợ Filter, Sort, Pagination)
exports.getMenuItems = async (req, res) => {
    try {
        const { 
            page = 1, limit = 100, 
            search = '', category_id, status, sort = 'newest' 
        } = req.query;

        const offset = (page - 1) * limit;
        const params = [];
        let query = `
            SELECT i.*, c.name as category_name 
            FROM menu_items i
            LEFT JOIN menu_categories c ON i.category_id = c.id
            WHERE i.is_deleted = false
        `;

        if (category_id) { params.push(category_id); query += ` AND i.category_id = $${params.length}`; }
        if (status) { params.push(status); query += ` AND i.status = $${params.length}`; }
        if (search) { params.push(`%${search}%`); query += ` AND i.name ILIKE $${params.length}`; }

        switch (sort) {
            case 'price_asc': query += ` ORDER BY i.price ASC`; break;
            case 'price_desc': query += ` ORDER BY i.price DESC`; break;
            case 'name_asc': query += ` ORDER BY i.name ASC`; break;
            default: query += ` ORDER BY i.created_at DESC`;
        }

        const limitIdx = params.length + 1;
        const offsetIdx = params.length + 2;
        query += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi Server' });
    }
};

// Lấy chi tiết 1 món
exports.getMenuItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const itemRes = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
        if (itemRes.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy món" });
        const item = itemRes.rows[0];

        // Lấy modifiers
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
        item.modifier_groups = modRes.rows;

        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy chi tiết' });
    }
};

// Tạo món mới
exports.createMenuItem = async (req, res) => {
  const { category_id, name, description, price, prep_time_minutes, status, is_chef_recommended } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  // --- 1. VALIDATION ---

  // Validate Name (Required, 2-80 chars)
  if (!name || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ message: 'Tên món phải từ 2 đến 80 ký tự.' });
  }

  // Validate Price (Positive, max 999999)
  const numericPrice = Number(price);
  if (!price || isNaN(numericPrice) || numericPrice <= 0 || numericPrice > 999999) {
    return res.status(400).json({ message: 'Giá phải là số dương hợp lệ (0.01 - 999999).' });
  }

  // Validate Prep Time (Non-negative, 0-240)
  // Nếu không nhập thì mặc định là 15, nếu nhập thì phải check
  let finalPrepTime = 15;
  if (prep_time_minutes !== undefined && prep_time_minutes !== '') {
    const time = Number(prep_time_minutes);
    if (isNaN(time) || time < 0 || time > 240) {
      return res.status(400).json({ message: 'Thời gian chuẩn bị phải từ 0 đến 240 phút.' });
    }
    finalPrepTime = time;
  }

  // Validate Category (Must exist)
  if (!category_id) {
    return res.status(400).json({ message: 'Vui lòng chọn danh mục.' });
  }

  try {
    // Kiểm tra Category có tồn tại trong DB không
    const categoryCheck = await db.query('SELECT id FROM menu_categories WHERE id = $1', [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Danh mục không tồn tại.' });
    }

    // --- 2. INSERT VÀO DB ---
    const result = await db.query(
      `INSERT INTO menu_items 
      (category_id, name, description, price, prep_time_minutes, status, image_url, is_chef_recommended) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        category_id, 
        name.trim(), 
        description, 
        numericPrice, 
        finalPrepTime, 
        status || 'available', 
        imageUrl, 
        is_chef_recommended || false
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    // Nếu lỗi là do UUID không hợp lệ
    if (err.code === '22P02') {
        return res.status(400).json({ message: 'Mã danh mục không hợp lệ.' });
    }
    res.status(500).json({ message: 'Lỗi Server khi tạo món ăn' });
  }
};

// Cập nhật món
exports.updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    // --- 1. VALIDATION ---
    
    // Nếu có gửi tên -> Check độ dài
    if (body.name !== undefined) {
        if (body.name.trim().length < 2 || body.name.trim().length > 80) {
            return res.status(400).json({ message: 'Tên món phải từ 2 đến 80 ký tự.' });
        }
    }

    // Nếu có gửi giá -> Check số dương
    if (body.price !== undefined) {
        const p = Number(body.price);
        if (isNaN(p) || p <= 0 || p > 999999) {
            return res.status(400).json({ message: 'Giá phải là số dương hợp lệ (0.01 - 999999).' });
        }
    }

    // Nếu có gửi thời gian -> Check 0-240
    if (body.prep_time_minutes !== undefined && body.prep_time_minutes !== '') {
        const t = Number(body.prep_time_minutes);
        if (isNaN(t) || t < 0 || t > 240) {
            return res.status(400).json({ message: 'Thời gian chuẩn bị phải từ 0 đến 240 phút.' });
        }
    }

    // Nếu có đổi danh mục -> Check danh mục tồn tại
    if (body.category_id) {
        try {
            const catCheck = await db.query('SELECT id FROM menu_categories WHERE id = $1', [body.category_id]);
            if (catCheck.rows.length === 0) {
                return res.status(400).json({ message: 'Danh mục mới không tồn tại.' });
            }
        } catch (err) {
            return res.status(400).json({ message: 'Mã danh mục không hợp lệ.' });
        }
    }

    // --- 2. UPDATE QUERY ---

    try {
        let fields = [];
        let values = [];
        let idx = 1;

        // Chỉ update những trường có gửi lên (và hợp lệ)
        if(body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(body.name.trim()); }
        if(body.price !== undefined) { fields.push(`price = $${idx++}`); values.push(Number(body.price)); }
        if(body.category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(body.category_id); }
        if(body.status !== undefined) { fields.push(`status = $${idx++}`); values.push(body.status); }
        if(body.description !== undefined) { fields.push(`description = $${idx++}`); values.push(body.description); }
        if(body.prep_time_minutes !== undefined) { fields.push(`prep_time_minutes = $${idx++}`); values.push(Number(body.prep_time_minutes)); }
        if(body.is_chef_recommended !== undefined) { fields.push(`is_chef_recommended = $${idx++}`); values.push(body.is_chef_recommended === 'true' || body.is_chef_recommended === true); }
        
        // Nếu có ảnh mới thì update
        if(imageUrl) { fields.push(`image_url = $${idx++}`); values.push(imageUrl); }

        // Nếu không có trường nào để update -> Trả về luôn
        if (fields.length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu nào thay đổi" });
        }

        fields.push(`updated_at = NOW()`);
        
        const query = `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        values.push(id);

        const result = await db.query(query, values);
        
        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy món ăn" });
        
        res.json(result.rows[0]);

    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi cập nhật món ăn' });
    }
};

// Xóa món (Soft Delete)
exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE menu_items SET is_deleted = true WHERE id = $1", [id]);
        res.json({ message: "Đã xóa (Soft delete)" });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xóa món' });
    }
};

// Upload ảnh phụ (Multi)
exports.addItemPhotos = async (req, res) => {
    const { id } = req.params;
    const files = req.files; 

    if (!files || files.length === 0) return res.status(400).json({ message: "Chưa chọn ảnh" });

    try {
        const promises = files.map(file => 
            db.query('INSERT INTO menu_item_photos (menu_item_id, url) VALUES ($1, $2)', [id, file.path])
        );
        await Promise.all(promises);
        res.status(201).json({ message: `Đã thêm ${files.length} ảnh` });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi upload ảnh phụ' });
    }
};

// Lấy menu cho khách (Guest)
exports.getGuestMenu = async (req, res) => {
    try {
        const query = `
            SELECT i.*, c.name as category_name
            FROM menu_items i
            JOIN menu_categories c ON i.category_id = c.id
            WHERE i.is_deleted = false 
              AND i.status = 'available'
              AND c.status = 'active'
            ORDER BY c.display_order ASC, i.name ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi tải menu khách' });
    }
};