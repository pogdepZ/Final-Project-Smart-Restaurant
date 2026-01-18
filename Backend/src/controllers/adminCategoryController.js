const service = require("../services/adminCategoryService");

exports.list = async (req, res) => {
  try {
    const { status = "ALL", includeDeleted } = req.query;
    const categories = await service.listCategories({
      status,
      includeDeleted: includeDeleted === "true",
    });
    res.json({ categories });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const category = await service.createCategory(req.body);
    res.json({ category });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const category = await service.updateCategory(req.params.id, req.body);
    res.json({ category });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { moveToCategoryId } = req.body || {};
    await service.deleteCategory(req.params.id, { moveToCategoryId });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "Server error" });
  }
};
