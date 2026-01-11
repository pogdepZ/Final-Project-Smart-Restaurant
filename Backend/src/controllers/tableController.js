const TableRepository = require("../repositories/tableRepository"); // <--- Import Repo
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

const VALID_LOCATIONS = ["Indoor", "Outdoor", "Patio", "VIP Room"];

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

    // Generate QR (Logic này vẫn nên ở Controller hoặc Service, không phải Repo)
    const qrPayload = { table_number };
    const qrToken = jwt.sign(qrPayload, process.env.QR_SECRET || "secret", {
      expiresIn: "365d",
    });
    const clientUrl = `http://localhost:5173/menu?token=${qrToken}`;
    const qrImage = await QRCode.toDataURL(clientUrl);

    // Save to DB via Repo
    const newTable = await TableRepository.create({
      table_number,
      capacity: cap,
      location,
      description,
      qr_token: qrToken,
    });

    res.status(201).json({ ...newTable, qr_image: qrImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
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
