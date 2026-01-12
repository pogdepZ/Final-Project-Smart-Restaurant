const modifierService = require("../services/modifierService");

exports.getGroups = async (req, res) => {
  try {
    const groups = await modifierService.getAllGroups();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải danh sách" });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const group = await modifierService.createGroup(req.body);
    res.status(201).json(group);
  } catch (err) {
    // Nếu là lỗi validation do mình throw Error thì trả 400
    res.status(400).json({ message: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await modifierService.updateGroup(req.params.id, req.body);
    res.json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.addOption = async (req, res) => {
  try {
    const option = await modifierService.addOption(
      req.params.group_id,
      req.body
    );
    res.status(201).json(option);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.attachGroupToItem = async (req, res) => {
  try {
    const result = await modifierService.attachGroupToItem(
      req.params.item_id,
      req.body.group_id
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
