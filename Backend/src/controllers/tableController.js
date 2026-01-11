const TableRepository = require("../repositories/tableRepository"); // <--- Import Repo
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

const VALID_LOCATIONS = ["Indoor", "Outdoor", "Patio", "VIP Room"];

// Helper tạo Token & Ảnh QR (Logic nghiệp vụ)
const generateSignedQR = async (tableId, tableNumber) => {
    const payload = {
        table_id: tableId,
        table_number: tableNumber,
        type: 'table_qr'
    };
    
    const token = jwt.sign(payload, process.env.QR_SECRET, { expiresIn: '2y' });
    
    const clientUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/menu?token=${token}`;
    const qrImage = await QRCode.toDataURL(clientUrl);

    return { token, qrImage };
};

exports.regenerateQR = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Tìm bàn
        const table = await TableRepository.findById(id);
        if (!table) return res.status(404).json({ message: "Bàn không tồn tại" });

        // 2. Tạo token mới
        const { token, qrImage } = await generateSignedQR(table.id, table.table_number);

        // 3. Update DB
        await TableRepository.updateQRToken(id, token);

        res.json({ 
            message: "Đã làm mới mã QR", 
            qr_token: token, 
            qr_image: qrImage 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi làm mới QR' });
    }
};

// 1. GET Tables
exports.getTables = async (req, res) => {
  try {
    const { status, location, sort } = req.query;

    // Xử lý Sort Query tại Controller (Business Logic)
    let sortQuery = " ORDER BY table_number ASC";
    switch (sort) {
      case "capacity_asc":
        sortQuery = ` ORDER BY capacity ASC`;
        break;
      case "capacity_desc":
        sortQuery = ` ORDER BY capacity DESC`;
        break;
      case "newest":
        sortQuery = ` ORDER BY created_at DESC`;
        break;
      case "number_desc":
        sortQuery = ` ORDER BY table_number DESC`;
        break;
    }

    // Gọi Repository
    const tables = await TableRepository.getAll({
      status,
      location,
      sortQuery,
    });
    res.json(tables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// 2. CREATE Table
exports.createTable = async (req, res) => {
  const { table_number, capacity, location, description } = req.body;

  // Validation
  if (!table_number || !capacity || !location) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }
  const cap = parseInt(capacity);
  if (isNaN(cap) || cap < 1 || cap > 20) {
    return res.status(400).json({ message: "Sức chứa 1-20" });
  }
  if (!VALID_LOCATIONS.includes(location)) {
    return res.status(400).json({ message: "Vị trí không hợp lệ" });
  }

  try {
    // Check Duplicate
    const exist = await TableRepository.findByNumber(table_number);
    if (exist)
      return res
        .status(400)
        .json({ message: `Số bàn '${table_number}' đã tồn tại` });

    // 2. Tạo bàn trước (để lấy ID)
    const newTable = await TableRepository.create({ 
        table_number, capacity, location, description 
    });

    // 3. Sinh QR Token dựa trên ID vừa có
    const { token, qrImage } = await generateSignedQR(newTable.id, newTable.table_number);

    // 4. Update Token vào DB
    const finalTable = await TableRepository.updateQRToken(newTable.id, token);
    
    // Trả về kết quả kèm ảnh QR
    res.status(201).json({ ...finalTable, qr_image: qrImage });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

// 3. UPDATE Table
exports.updateTable = async (req, res) => {
  const { id } = req.params;
  const { table_number, capacity, location, description } = req.body;

  try {
    if (location && !VALID_LOCATIONS.includes(location)) {
      return res.status(400).json({ message: `Vị trí không hợp lệ.` });
    }

    if (table_number) {
      const exist = await TableRepository.findByNumberExceptId(
        table_number,
        id
      );
      if (exist)
        return res
          .status(400)
          .json({ message: `Số bàn '${table_number}' trùng lặp` });
    }

    const updatedTable = await TableRepository.update(id, req.body);

    if (!updatedTable)
      return res.status(404).json({ message: "Không tìm thấy bàn" });
    res.json(updatedTable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

// 4. TOGGLE Status
exports.toggleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Trạng thái sai" });
  }

  try {
    // Warning logic
    if (status === "inactive") {
      const activeCount = await TableRepository.countActiveOrders(id);
      const forceUpdate = req.query.force === "true";

      if (activeCount > 0 && !forceUpdate) {
        return res.status(200).json({
          warning: true,
          message: `Bàn đang có ${activeCount} đơn chưa xong.`,
          active_orders: activeCount,
        });
      }
    }

    const updatedTable = await TableRepository.updateStatus(id, status);
    res.json(updatedTable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
};
