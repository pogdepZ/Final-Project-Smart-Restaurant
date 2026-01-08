const db = require('../config/db');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

// Danh sách vị trí hợp lệ (Predefined options)
const VALID_LOCATIONS = ['Indoor', 'Outdoor', 'Patio', 'VIP Room'];

// 1. Lấy danh sách (GET) - Hỗ trợ Filter & Sort
exports.getTables = async (req, res) => {
  try {
    const { status, location, sort } = req.query;

    let query = `SELECT * FROM tables WHERE 1=1`;
    const params = [];

    // --- FILTER ---
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (location) {
      // Filter chính xác hoặc tương đối tùy nghiệp vụ, ở đây làm tương đối
      params.push(`%${location}%`); 
      query += ` AND location ILIKE $${params.length}`;
    }

    // --- SORT ---
    // Sort tables by: Table number, Capacity, Creation date
    switch (sort) {
      case 'capacity_asc': query += ` ORDER BY capacity ASC`; break;
      case 'capacity_desc': query += ` ORDER BY capacity DESC`; break;
      case 'newest': query += ` ORDER BY created_at DESC`; break;
      case 'number_desc': query += ` ORDER BY table_number DESC`; break;
      default: query += ` ORDER BY table_number ASC`; // Default
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

// 2. Tạo bàn (POST) - Validation chặt chẽ
exports.createTable = async (req, res) => {
  const { table_number, capacity, location, description } = req.body;

  // Validation: Required fields
  if (!table_number || !capacity || !location) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (Số bàn, Sức chứa, Vị trí)' });
  }

  // Validation: Capacity 1-20
  const cap = parseInt(capacity);
  if (isNaN(cap) || cap < 1 || cap > 20) {
    return res.status(400).json({ message: 'Sức chứa phải là số nguyên từ 1 đến 20' });
  }

  // Validation: Location predefined
  if (!VALID_LOCATIONS.includes(location)) {
    return res.status(400).json({ 
        message: `Vị trí không hợp lệ. Chỉ chấp nhận: ${VALID_LOCATIONS.join(', ')}` 
    });
  }

  try {
    // Validation: Unique table_number
    const exist = await db.query('SELECT id FROM tables WHERE table_number = $1', [table_number]);
    if (exist.rows.length > 0) {
      return res.status(400).json({ message: `Số bàn '${table_number}' đã tồn tại` });
    }

    // Generate QR
    const qrPayload = { table_number };
    const qrToken = jwt.sign(qrPayload, process.env.QR_SECRET || 'secret', { expiresIn: '365d' });
    // URL frontend xử lý quét
    const clientUrl = `http://localhost:5173/menu?token=${qrToken}`; 
    const qrImage = await QRCode.toDataURL(clientUrl);

    const result = await db.query(
      `INSERT INTO tables (table_number, capacity, location, description, qr_token, status) 
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [table_number, cap, location, description, qrToken]
    );

    res.status(201).json({ ...result.rows[0], qr_image: qrImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

// 3. Cập nhật bàn (PUT)
exports.updateTable = async (req, res) => {
  const { id } = req.params;
  const { table_number, capacity, location, description } = req.body;

  try {
    // Nếu cập nhật vị trí, validate lại
    if (location && !VALID_LOCATIONS.includes(location)) {
        return res.status(400).json({ message: `Vị trí không hợp lệ.` });
    }

    // Nếu cập nhật số bàn, check trùng
    if (table_number) {
        const exist = await db.query('SELECT id FROM tables WHERE table_number = $1 AND id != $2', [table_number, id]);
        if (exist.rows.length > 0) {
            return res.status(400).json({ message: `Số bàn '${table_number}' đã tồn tại` });
        }
    }

    const result = await db.query(
        `UPDATE tables SET 
            table_number = COALESCE($1, table_number),
            capacity = COALESCE($2, capacity),
            location = COALESCE($3, location),
            description = COALESCE($4, description)
        WHERE id = $5 RETURNING *`,
        [table_number, capacity, location, description, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bàn" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi cập nhật' });
  }
};

// 4. Đổi trạng thái (PATCH) - Deactivate Logic
exports.toggleStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' hoặc 'inactive'

    if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    try {
        // Requirement: "Display warning if table has active orders"
        if (status === 'inactive') {
            const activeOrders = await db.query(
                `SELECT id FROM orders WHERE table_id = $1 AND status NOT IN ('completed', 'cancelled')`,
                [id]
            );

            // Nếu có tham số ?force=true thì bỏ qua check, còn không thì báo warning
            const forceUpdate = req.query.force === 'true';

            if (activeOrders.rows.length > 0 && !forceUpdate) {
                return res.status(200).json({ // Trả về 200 nhưng kèm flag warning
                    warning: true,
                    message: `Bàn này đang có ${activeOrders.rows.length} đơn hàng chưa hoàn thành.`,
                    active_orders: activeOrders.rows.length
                });
            }
        }

        const result = await db.query(
            'UPDATE tables SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi Server' });
    }
};