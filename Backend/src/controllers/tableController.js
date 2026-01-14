const tableService = require("../services/tableService");

exports.getTables = async (req, res) => {
  try {
    const tables = await tableService.getAllTables(req.query);
    res.json(tables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

exports.getTableById = async (req, res) => {
  try {
    const table = await tableService.getTableById(req.params.id);
    res.json(table);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.createTable = async (req, res) => {
  try {
    const result = await tableService.createTable(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const result = await tableService.updateTable(
      req.params.id,
      req.body,
      req.io
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { force } = req.query; // ?force=true
    const result = await tableService.toggleStatus(
      req.params.id,
      req.body.status,
      force === "true",
      req.io
    );

    // Nếu service trả về warning thì status code 200 nhưng frontend phải xử lý
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.regenerateQR = async (req, res) => {
  try {
    const result = await tableService.regenerateQR(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.BulkRegenerateQR = async (req, res) => {
  try {
    const result = await tableService.BulkRegenerateQR();
    res.json(result);
  }

  catch (err) {
    res.status(500).json({ message: err.message });
  } 
};

// 6. Lấy danh sách bàn được phân công (Cho Waiter)
exports.getMyTables = async (req, res) => {
  try {
    const waiterId = req.user.id; // Lấy từ Token
    const tables = await tableService.getByWaiterId(waiterId);
    console.log("Assigned tables:", tables);
    res.json(tables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy danh sách bàn" });
  }
};

// 7. Phân công bàn (Cho Admin)
exports.assignTable = async (req, res) => {
  const { waiter_id, table_id } = req.body;
  console.log(waiter_id, table_id);
  if (!waiter_id || !table_id)
    return res.status(400).json({ message: "Thiếu thông tin" });

  try {
    await tableService.assignTableToWaiter(waiter_id, table_id);
    res.json({ message: "Phân công thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi phân công" });
  }
};
