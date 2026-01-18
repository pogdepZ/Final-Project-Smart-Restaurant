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
      req.body,
    );
    return res.json({ message: "Updated modifier groups", ...data });
  } catch (e) {
    return sendError(res, e, "Server error");
  }
};

// GET /admin/menu-items/:id/photos
exports.getPhotos = async (req, res, next) => {
  try {
    const menuItemId = req.params.id;
    const photos = await service.getMenuItemPhotos(menuItemId);
    return res.json({ photos });
  } catch (e) {
    return next(e);
  }
};

// POST /admin/menu-items/:id/photos  (upload.array("images", 10))
exports.uploadPhotos = async (req, res, next) => {
  try {
    const menuItemId = req.params.id;

    // multer-cloudinary sẽ trả file info ở req.files
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // CloudinaryStorage trả URL ở file.path
    const urls = files.map((f) => f.path).filter(Boolean);

    const photos = await service.addMenuItemPhotos(menuItemId, urls);

    return res.status(201).json({
      message: "Uploaded",
      photos,
    });
  } catch (e) {
    next(e);
  }
};

// PATCH /admin/menu-items/:id/photos/:photoId/primary
exports.setPrimary = async (req, res, next) => {
  try {
    const menuItemId = req.params.id;
    const photoId = req.params.photoId;

    const photos = await service.setPrimaryPhoto(menuItemId, photoId);
    return res.json({ photos });
  } catch (e) {
    return next(e);
  }
};

// DELETE /admin/menu-items/:id/photos/:photoId
exports.deletePhoto = async (req, res, next) => {
  try {
    const menuItemId = req.params.id;
    const photoId = req.params.photoId;

    const photos = await service.removePhoto(menuItemId, photoId);
    return res.json({ photos });
  } catch (e) {
    return next(e);
  }
};
