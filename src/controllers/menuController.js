const db = require('../config/db');

// --- CATEGORIES ---
exports.getCategories = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM menu_categories ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
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
    res.status(500).json({ message: 'Lỗi tạo danh mục (Tên có thể bị trùng)' });
  }
};

// --- ITEMS ---
exports.getMenuItems = async (req, res) => {
    try {
        const { category_id, search } = req.query;
        let query = `
            SELECT i.*, c.name as category_name 
            FROM menu_items i
            LEFT JOIN menu_categories c ON i.category_id = c.id
            WHERE i.is_deleted = false
        `;
        const params = [];

        if (category_id) {
            params.push(category_id);
            query += ` AND i.category_id = $${params.length}`;
        }
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND i.name ILIKE $${params.length}`;
        }

        query += ` ORDER BY i.created_at DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi Server' });
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
    res.status(500).json({ message: 'Lỗi tạo món ăn' });
  }
};

exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE menu_items SET is_deleted = true WHERE id = $1", [id]);
        res.json({ message: "Đã xóa món ăn" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi xóa món' });
    }
};
