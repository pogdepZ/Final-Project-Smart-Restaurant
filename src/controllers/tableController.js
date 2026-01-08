const db = require("../config/db");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const archiver = require("archiver");

const QR_SECRET = process.env.QR_SECRET || "secret_bi_mat";

const generateQRToken = (table) => {
  const payload = {
    tableId: table.id,
    version: table.qrVersion,
  };
  return jwt.sign(payload, QR_SECRET);
};

// 1. Tạo bàn
exports.createTable = async (req, res) => {
  const { table_number, capacity, location } = req.body;

  if (!table_number || !capacity) {
    return res.status(400).json({ message: 'Vui lòng nhập số bàn và sức chứa' });
  }

  try {
    // Bước 1: Kiểm tra trùng số bàn
    const exist = await db.query('SELECT * FROM tables WHERE table_number = $1', [table_number]);
    if (exist.rows.length > 0) {
      return res.status(400).json({ message: 'Số bàn này đã tồn tại' });
    }

    // Bước 2: Tạo Token bí mật cho bàn (Dùng secret riêng cho QR)
    // Payload chỉ cần chứa table_number là đủ định danh
    const qrPayload = {
      table_number: table_number,
      restaurant_id: 1 // Hardcode vì làm Single Tenant
    };
    
    // Token này không bao giờ hết hạn (hoặc để rất lâu)
    const qrToken = jwt.sign(qrPayload, process.env.QR_SECRET || 'secret_qr', { expiresIn: '365d' });

    // Bước 3: Tạo URL cho khách hàng (Frontend URL)
    // Ví dụ: https://smart-restaurant.com/menu?token=...
    // Ở local chúng ta dùng localhost:5173 (Port của Vite Frontend)
    const clientUrl = `http://localhost:5173/menu?token=${qrToken}`;

    // Bước 4: Tạo ảnh QR Code (dạng Base64 để hiển thị luôn)
    const qrImage = await QRCode.toDataURL(clientUrl);

    // Bước 5: Lưu vào Database
    const newTable = await db.query(
      `INSERT INTO tables (table_number, capacity, location, qr_token, status) 
       VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [table_number, capacity, location, qrToken]
    );

    // Trả về thông tin bàn + hình ảnh QR để frontend hiển thị
    res.status(201).json({
      ...newTable.rows[0],
      qr_image: qrImage // Frontend sẽ dùng cái này để in ra
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

// 2. Cập nhật thông tin (Dùng cho Modal Sửa)
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, location, status } = req.body;

    const updatedTable = await prisma.table.update({
      where: { id: id },
      data: {
        name,
        capacity: parseInt(capacity),
        location,
        status, // 'ACTIVE' hoặc 'INACTIVE'
      },
    });

    res.json(updatedTable);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Tên bàn đã tồn tại" });
    }
    res.status(500).json({ error: error.message });
  }
};

// 3. Lấy danh sách
exports.getTables = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM tables ORDER BY table_number ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// 4. Regenerate QR
exports.regenerateQR = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({ where: { id } });

    const newVersion = (table.qrVersion || 1) + 1;
    const newToken = jwt.sign(
      { tableId: table.id, version: newVersion },
      QR_SECRET
    );

    const updatedTable = await prisma.table.update({
      where: { id },
      data: { qrVersion: newVersion, qrToken: newToken },
    });

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [CẦN KHỚP VỚI SCHEMA]
// Nếu bạn muốn dùng hàm này riêng để bật tắt nhanh, hãy ánh xạ boolean sang string
exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body; // Frontend gửi true/false

    const updatedTable = await prisma.table.update({
      where: { id },
      data: { status: isActive ? "ACTIVE" : "INACTIVE" }, // [SỬA] Chuyển sang String
    });

    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Xóa bàn (Soft Delete hoặc Hard Delete tùy yêu cầu)
// Ở đây làm Hard Delete cho đơn giản, nếu bàn đang có order thì DB sẽ báo lỗi khóa ngoại
exports.deleteTable = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tables WHERE id = $1', [id]);
    res.json({ message: 'Xóa bàn thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server (Có thể bàn đang có đơn hàng)' });
  }
};

// 5. Verify QR (Logic quét mã)
exports.verifyQR = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, QR_SECRET);

    const table = await prisma.table.findUnique({
      where: { id: decoded.tableId },
    });

    if (!table) {
      return res.status(404).json({ error: "Bàn không tồn tại" });
    }

    // [SỬA] Kiểm tra status string thay vì isActive boolean
    if (table.status !== "ACTIVE") {
      return res.status(403).json({
        error: "Bàn này đang tạm ngưng phục vụ. Vui lòng liên hệ nhân viên.",
      });
    }

    if (decoded.version < table.qrVersion) {
      return res
        .status(400)
        .json({ error: "Mã QR này đã cũ. Vui lòng xin mã mới." });
    }

    res.json({
      valid: true,
      table: { id: table.id, name: table.name },
    });
  } catch (error) {
    res.status(400).json({ error: "Mã QR không hợp lệ" });
  }
};

// TẢI TẤT CẢ QR (ZIP)
exports.downloadAllQRs = async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { status: "ACTIVE" }, // Chỉ tải bàn đang hoạt động
    });

    if (tables.length === 0)
      return res.status(404).json({ error: "Không có bàn nào" });

    // Thiết lập Header để trình duyệt hiểu đây là file zip
    res.attachment("All_QR_Codes.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res); // Nối luồng nén thẳng vào response

    // Duyệt từng bàn, tạo ảnh QR và ném vào file zip
    for (const table of tables) {
      // URL khách quét (Lưu ý: Thay localhost bằng IP máy hoặc domain thật khi deploy)
      // Tốt nhất là lấy từ biến môi trường: process.env.FRONTEND_URL
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const qrData = `${frontendUrl}/scan/${table.qrToken}`;

      // Tạo Buffer ảnh PNG
      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 500,
        margin: 2,
      });

      // Thêm file vào zip với tên: "Ban-1.png"
      archive.append(qrBuffer, { name: `${table.name}.png` });
    }

    await archive.finalize();
  } catch (error) {
    console.error(error);
    // Nếu lỗi khi đang stream file thì không gửi json được nữa
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
};

// 6. Làm mới TOÀN BỘ QR
exports.regenerateAllQRs = async (req, res) => {
  try {
    // 1. Lấy tất cả bàn đang hoạt động
    const tables = await prisma.table.findMany({
      where: { status: "ACTIVE" },
    });

    if (tables.length === 0)
      return res.json({ message: "Không có bàn nào cần làm mới", count: 0 });

    // 2. Duyệt qua từng bàn và cập nhật
    // (Dùng Promise.all để chạy song song cho nhanh)
    const updates = tables.map((table) => {
      const newVersion = (table.qrVersion || 1) + 1;
      const newToken = jwt.sign(
        { tableId: table.id, version: newVersion },
        QR_SECRET
      );

      return prisma.table.update({
        where: { id: table.id },
        data: { qrVersion: newVersion, qrToken: newToken },
      });
    });

    await Promise.all(updates);

    res.json({
      message: "Đã làm mới thành công",
      count: tables.length,
      tables: tables.map((t) => t.name), // Trả về danh sách tên bàn để hiển thị
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
