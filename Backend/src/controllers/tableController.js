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
    const result = await tableService.updateTable(req.params.id, req.body, req.io);
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
