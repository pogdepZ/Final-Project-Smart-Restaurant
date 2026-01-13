const service = require("../services/menuService");
// helper wrap async để khỏi try/catch lặp
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ===== CATEGORIES =====
exports.getCategories = asyncHandler(async (req, res) => {
  const data = await service.getCategories();
  res.json(data);
});

exports.createCategory = asyncHandler(async (req, res) => {
  const created = await service.createCategory(req.body);
  res.status(201).json(created);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const updated = await service.updateCategory(req.params.id, req.body);
  res.json(updated);
});

// ===== MENU ITEMS =====
exports.getMenuItems = asyncHandler(async (req, res) => {
  const data = await service.getMenuItemsAdmin(req.query);
  res.json(data);
});

exports.getMenuItemById = asyncHandler(async (req, res) => {
  const data = await service.getMenuItemDetail(req.params.id);
  res.json(data);
});

exports.getMenuItemById = asyncHandler(async (req, res) => {
  const data = await service.getMenuItemDetail(req.params.id);
  res.json(data);
});
exports.getRelatedMenuItems = asyncHandler(async (req, res) => {
  // Truyền ID món ăn hiện tại vào service để tìm món liên quan
  const data = await service.getRelatedMenuItems(req.params.id);
  res.json(data);
});

exports.createMenuItem = asyncHandler(async (req, res) => {
  const imageUrl = req.file ? req.file.path : null;
  const created = await service.createMenuItem(req.body, imageUrl);
  res.status(201).json(created);
});

exports.updateMenuItem = asyncHandler(async (req, res) => {
  const imageUrl = req.file ? req.file.path : undefined;
  const updated = await service.updateMenuItem(
    req.params.id,
    req.body,
    imageUrl
  );
  res.json(updated);
});

exports.deleteMenuItem = asyncHandler(async (req, res) => {
  const result = await service.deleteMenuItem(req.params.id);
  res.json(result);
});

exports.addItemPhotos = asyncHandler(async (req, res) => {
  const result = await service.addItemPhotos(req.params.id, req.files);
  res.status(201).json(result);
});

exports.getGuestMenu = asyncHandler(async (req, res) => {
  const data = await service.getGuestMenu();
  res.json(data);
});

exports.getMenuItemsPublic = asyncHandler(async (req, res) => {
  const result = await service.getMenuItemsPublic(req.query);
  res.json(result);
});
