const TableRepository = require("../repositories/tableRepository");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

const VALID_LOCATIONS = ["Indoor", "Outdoor", "Patio", "VIP Room"];

class TableService {
  // Helper: Sinh QR Token & Image
  async generateSignedQR(tableId, tableNumber) {
    const payload = {
      table_id: tableId,
      table_number: tableNumber,
      type: "table_qr",
    };

    const token = jwt.sign(payload, process.env.QR_SECRET, { expiresIn: "2y" });
    const clientUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/menu?token=${token}`;
    const qrImage = await QRCode.toDataURL(clientUrl);

    return { token, qrImage };
  }

  // 1. Get All Tables
  async getAllTables({ status, location, sort }) {
    let sortQuery = " ORDER BY table_number ASC";
    
    // Logic sort mapping
    switch (sort) {
      case 'capacity_asc': sortQuery = " ORDER BY capacity ASC"; break;
      case 'capacity_desc': sortQuery = " ORDER BY capacity DESC"; break;
      case 'name_desc': sortQuery = " ORDER BY table_number DESC"; break;
      case 'name_asc': sortQuery = " ORDER BY table_number ASC"; break;
      case 'newest': sortQuery = " ORDER BY created_at DESC"; break;
      case 'oldest': sortQuery = " ORDER BY created_at ASC"; break;
      default: sortQuery = " ORDER BY table_number ASC";
    }

    return await TableRepository.getAll({ status, location, sortQuery });
  }

  // 2. Get Table By ID
  async getTableById(id) {
    const table = await TableRepository.findById(id);
    if (!table) throw new Error("Không tìm thấy bàn");
    return table;
  }

  // 3. Create Table (Logic phức tạp: Check -> Create -> Gen QR -> Update)
  async createTable({ table_number, capacity, location, description }) {
    // Validation Logic
    if (!table_number || !capacity || !location) {
      throw new Error("Thiếu thông tin bắt buộc");
    }
    const cap = parseInt(capacity);
    if (isNaN(cap) || cap < 1 || cap > 20) {
      throw new Error("Sức chứa phải là số nguyên từ 1 đến 20");
    }
    if (!VALID_LOCATIONS.includes(location)) {
      throw new Error("Vị trí không hợp lệ");
    }

    // Check Duplicate
    const exist = await TableRepository.findByNumber(table_number);
    if (exist) throw new Error(`Số bàn '${table_number}' đã tồn tại`);

    // Create Table
    const newTable = await TableRepository.create({
      table_number,
      capacity: cap,
      location,
      description,
    });

    // Gen QR
    const { token, qrImage } = await this.generateSignedQR(newTable.id, newTable.table_number);

    // Update Token
    const finalTable = await TableRepository.updateQRToken(newTable.id, token);

    return { ...finalTable, qr_image: qrImage };
  }

  // 4. Update Table
  async updateTable(id, data) {
    const { table_number, location } = data;

    if (location && !VALID_LOCATIONS.includes(location)) {
      throw new Error("Vị trí không hợp lệ");
    }

    if (table_number) {
      const exist = await TableRepository.findByNumberExceptId(table_number, id);
      if (exist) throw new Error(`Số bàn '${table_number}' trùng lặp`);
    }

    const updatedTable = await TableRepository.update(id, data);
    if (!updatedTable) throw new Error("Không tìm thấy bàn");
    
    return updatedTable;
  }

  // 5. Toggle Status
  async toggleStatus(id, status, force = false) {
    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái không hợp lệ");
    }

    // Warning logic
    if (status === "inactive" && !force) {
      const activeCount = await TableRepository.countActiveOrders(id);
      if (activeCount > 0) {
        // Return object đặc biệt để Controller biết là warning
        return {
          warning: true,
          message: `Bàn đang có ${activeCount} đơn chưa xong.`,
          active_orders: activeCount,
        };
      }
    }

    return await TableRepository.updateStatus(id, status);
  }

  // 6. Regenerate QR
  async regenerateQR(id) {
    const table = await TableRepository.findById(id);
    if (!table) throw new Error("Bàn không tồn tại");

    const { token, qrImage } = await this.generateSignedQR(table.id, table.table_number);
    
    await TableRepository.updateQRToken(id, token);

    return { 
        message: "Đã làm mới mã QR", 
        qr_token: token, 
        qr_image: qrImage 
    };
  }
}

module.exports = new TableService();