const TableRepository = require("../repositories/tableRepository");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
// Kiểm tra kỹ đường dẫn này trong project của bạn
const socketService = require("./socketService"); 

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

  // 3. Create Table
  async createTable({ table_number, capacity, location, description }) {
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

    const exist = await TableRepository.findByNumber(table_number);
    if (exist) throw new Error(`Số bàn '${table_number}' đã tồn tại`);

    const newTable = await TableRepository.create({
      table_number,
      capacity: cap,
      location,
      description,
    });

    const { token, qrImage } = await this.generateSignedQR(newTable.id, newTable.table_number);
    const finalTable = await TableRepository.updateQRToken(newTable.id, token);

    return { ...finalTable, qr_image: qrImage };
  }

  // 4. Update Table
  async updateTable(id, data, io) {
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
    
    // Notify Socket
    if (io) socketService.notifyTableUpdate(io, { type: 'update', table: updatedTable });

    return updatedTable;
  }

  // 5. Toggle Status
  async toggleStatus(id, status, force = false, io) {
    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái không hợp lệ");
    }

    if (status === "inactive" && !force) {
      const activeCount = await TableRepository.countActiveOrders(id);
      if (activeCount > 0) {
        return {
          warning: true,
          message: `Bàn đang có ${activeCount} đơn chưa xong.`,
          active_orders: activeCount,
        };
      }
    }

    // --- FIX LỖI TẠI ĐÂY ---
    // Gọi Repository update trước để lấy kết quả
    const updatedTable = await TableRepository.updateStatus(id, status);
    
    // Sau đó mới notify
    if (io) socketService.notifyTableUpdate(io, { type: 'update', table: updatedTable });

    return updatedTable;
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