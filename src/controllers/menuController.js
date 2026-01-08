const db = require('../config/db');

// --- 1. CATEGORIES CRUD ---

// 1.1 List Categories (View)
exports.getCategories = async (req, res) => {
  try {
    const { sort } = req.query;
    let query = 'SELECT * FROM menu_categories WHERE 1=1';
    
    // Sort logic
    if (sort === 'name') query += ' ORDER BY name ASC';
    else if (sort === 'date') query += ' ORDER BY created_at DESC';
    else query += ' ORDER BY display_order ASC'; // Default

    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

// 1.2 Create Category
exports.createCategory = async (req, res) => {
  const { name, description, display_order, status } = req.body;

  // Validation
  if (!name || name.length < 2 || name.length > 50) {
    return res.status(400).json({ message: 'Tên danh mục phải từ 2-50 ký tự' });
  }
  if (display_order && display_order < 0) {
    return res.status(400).json({ message: 'Thứ tự hiển thị phải không âm' });
  }

  try {
    const result = await db.query(
      `INSERT INTO menu_categories (name, description, display_order, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, display_order || 0, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    res.status(500).json({ message: 'Lỗi tạo danh mục' });
  }
};

// 1.3 Update Category
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

// --- 2. MENU ITEMS CRUD ---

// 2.1 Create Item (Validation & Logic)
exports.createMenuItem = async (req, res) => {
  const { category_id, name, description, price, prep_time_minutes, status, is_chef_recommended } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  // Validation thủ công (thay vì dùng Zod/Joi)
  if (!name || name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Tên món từ 2-80 ký tự' });
  if (!price || Number(price) <= 0) return res.status(400).json({ message: 'Giá phải lớn hơn 0' });
  if (!category_id) return res.status(400).json({ message: 'Phải chọn danh mục' });
  if (prep_time_minutes && (prep_time_minutes < 0 || prep_time_minutes > 240)) {
      return res.status(400).json({ message: 'Thời gian chuẩn bị 0-240 phút' });
  }

  try {
    const result = await db.query(
      `INSERT INTO menu_items 
      (category_id, name, description, price, prep_time_minutes, status, image_url, is_chef_recommended) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [category_id, name, description, price, prep_time_minutes || 0, status || 'available', imageUrl, is_chef_recommended || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi tạo món ăn' });
  }
};

// 2.2 List Items (Filter, Sort, Pagination)
exports.getMenuItems = async (req, res) => {
    try {
        const { 
            page = 1, limit = 10, search, category_id, status, sort 
        } = req.query;
        const offset = (page - 1) * limit;
        const params = [];
        let query = `
            SELECT i.*, c.name as category_name 
            FROM menu_items i
            LEFT JOIN menu_categories c ON i.category_id = c.id
            WHERE i.is_deleted = false
        `;

        // Filter
        if (category_id) { params.push(category_id); query += ` AND i.category_id = $${params.length}`; }
        if (status) { params.push(status); query += ` AND i.status = $${params.length}`; }
        if (search) { params.push(`%${search}%`); query += ` AND i.name ILIKE $${params.length}`; }

        // Sort
        // "popularity" logic: Cần join với bảng order_items (Bài tập yêu cầu trade-off)
        if (sort === 'popularity') {
             // Logic phức tạp: đếm số lần xuất hiện trong order_items
             query = `
                SELECT i.*, c.name as category_name, COUNT(oi.id) as order_count
                FROM menu_items i
                LEFT JOIN menu_categories c ON i.category_id = c.id
                LEFT JOIN order_items oi ON i.id = oi.menu_item_id
                WHERE i.is_deleted = false
             `;
             // Re-apply filters manually or restructure query... 
             // Để đơn giản cho bài tập, ta sort theo created_at nếu chưa implement bảng orders đầy đủ
             // Nếu đã có bảng orders:
             if (category_id) { params.push(category_id); query += ` AND i.category_id = $${params.length}`; }
             if (search) { params.push(`%${search}%`); query += ` AND i.name ILIKE $${params.length}`; }
             
             query += ` GROUP BY i.id, c.name ORDER BY order_count DESC`;
        } else {
            switch (sort) {
                case 'price_asc': query += ` ORDER BY i.price ASC`; break;
                case 'price_desc': query += ` ORDER BY i.price DESC`; break;
                case 'oldest': query += ` ORDER BY i.created_at ASC`; break;
                default: query += ` ORDER BY i.created_at DESC`;
            }
        }

        // Pagination
        const limitIdx = params.length + 1;
        const offsetIdx = params.length + 2;
        query += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        
        // Count total for pagination UI
        // (Simplified: not returning full count in this snippet to keep it short)

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi Server' });
    }
};

// 2.3 Update Item
exports.updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    try {
        // Dynamic Update Query
        // (Trong thực tế nên dùng thư viện query builder, ở đây ta làm thủ công)
        let fields = [];
        let values = [];
        let idx = 1;

        if(body.name) { fields.push(`name = $${idx++}`); values.push(body.name); }
        if(body.price) { fields.push(`price = $${idx++}`); values.push(body.price); }
        if(body.category_id) { fields.push(`category_id = $${idx++}`); values.push(body.category_id); }
        if(body.status) { fields.push(`status = $${idx++}`); values.push(body.status); }
        if(body.description) { fields.push(`description = $${idx++}`); values.push(body.description); }
        if(imageUrl) { fields.push(`image_url = $${idx++}`); values.push(imageUrl); }

        fields.push(`updated_at = NOW()`);
        
        const query = `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        values.push(id);

        const result = await db.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy" });
        res.json(result.rows[0]);
    } catch(err) {
        res.status(500).json({ message: 'Lỗi update' });
    }
};

// 2.4 Soft Delete
exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE menu_items SET is_deleted = true WHERE id = $1", [id]);
        res.json({ message: "Đã xóa (Soft delete)" });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xóa món' });
    }
};

// 3. PHOTOS (Multi Upload)
exports.addItemPhotos = async (req, res) => {
    const { id } = req.params;
    const files = req.files; // Array of files (Multer)

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

// 5. GUEST MENU (Public Read-only)
exports.getGuestMenu = async (req, res) => {
    try {
        // Logic: Lấy món available, chưa xóa, thuộc category active
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
        res.status(500).json({ message: 'Lỗi tải menu khách' });
    }
};