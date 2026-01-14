const service = require("../services/adminMenuService");

const sendError = (res, err, defaultMsg) => {
  const status = err?.status || 500;
  if (status === 500) console.error(defaultMsg, err);
  return res.status(status).json({ message: err?.message || defaultMsg });
};

exports.getCategories = async (req, res) => {
  try {
    const data = await service.getCategories(req.query);
    return res.json(data);
  } catch (e) {
    return sendError(res, e, "getCategories error");
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const data = await service.getMenuItems(req.query);
    return res.json(data);
  } catch (e) {
    return sendError(res, e, "Get menu items failed");
  }
};

exports.getMenuItemDetail = async (req, res) => {
  try {
    const data = await service.getMenuItemDetail(req.params.id);
    if (!data) return res.status(404).json({ message: "Menu item not found" });
    return res.json(data);
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const data = await service.createMenuItem(req.body);
    return res.status(201).json(data);
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const updated = await service.updateMenuItem(req.params.id, req.body);
    if (!updated)
      return res.status(404).json({ message: "Menu item not found" });
    return res.json({ message: "Updated", id: updated.id });
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

exports.toggleChefRecommended = async (req, res) => {
  try {
    const row = await service.toggleChefRecommended(req.params.id, req.body);
    if (!row) return res.status(404).json({ message: "Menu item not found" });
    return res.json({ id: row.id, isChefRecommended: row.is_chef_recommended });
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

exports.createCategory = async (req, res) => {
  try {
    const data = await service.createCategory(req.body);
    return res.status(201).json(data);
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const row = await service.deleteMenuItem(req.params.id);
    if (!row) return res.status(404).json({ message: "Menu item not found" });
    return res.json({ message: "Deleted", id: row.id });
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

exports.setMenuItemModifierGroups = async (req, res) => {
  try {
    const data = await service.setMenuItemModifierGroups(
      req.params.id,
      req.body
    );
    return res.json({ message: "Updated modifier groups", ...data });
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};
