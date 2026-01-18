const service = require("../services/adminModifierService");

const sendError = (res, err, defaultMsg) => {
  const status = err?.status || 500;
  if (status === 500) console.error(defaultMsg, err);
  return res.status(status).json({ message: err?.message || defaultMsg });
};

exports.getModifierGroups = async (req, res) => {
  try {
    const data = await service.getModifierGroups(req.query);
    return res.json(data);
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

// GROUPS
exports.getGroups = async (req, res) => {
  try {
    const data = await service.getGroups(req.query);
    return res.json(data);
  } catch (e) {
    console.log("getGroups error:", e);
    return sendError(res, e);
  }
};

exports.getGroupDetail = async (req, res) => {
  try {
    const data = await service.getGroupDetail(req.params.id);
    return res.json(data);
  } catch (e) {
    console.log("getGroupDetail error:", e);
    return sendError(res, e);
  }
};

exports.createGroup = async (req, res) => {
  try {
    const item = await service.createGroup(req.body);
    return res.status(201).json({ message: "Created", item });
  } catch (e) {
    console.log("createGroup error:", e);
    return sendError(res, e, 400);
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const item = await service.updateGroup(req.params.id, req.body);
    return res.json({ message: "Updated", item });
  } catch (e) {
    console.log("updateGroup error:", e);
    return sendError(res, e, 400);
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const item = await service.deleteGroup(req.params.id);
    return res.json({ message: "Deleted", item });
  } catch (e) {
    console.log("deleteGroup error:", e);
    return sendError(res, e, 400);
  }
};

// OPTIONS
exports.createOption = async (req, res) => {
  try {
    const item = await service.createOption(req.body);
    return res.status(201).json({ message: "Created", item });
  } catch (e) {
    console.log("createOption error:", e);
    return sendError(res, e, 400);
  }
};

exports.updateOption = async (req, res) => {
  try {
    const item = await service.updateOption(req.params.id, req.body);
    return res.json({ message: "Updated", item });
  } catch (e) {
    console.log("updateOption error:", e);
    return sendError(res, e, 400);
  }
};

exports.deleteOption = async (req, res) => {
  try {
    const item = await service.deleteOption(req.params.id);
    return res.json({ message: "Deleted", item });
  } catch (e) {
    console.log("deleteOption error:", e);
    return sendError(res, e, 400);
  }
};
