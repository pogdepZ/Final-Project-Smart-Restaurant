const repo = require("../repositories/adminMenuRepository");

function toInt(n, fallback) {
  const x = parseInt(n, 10);
  return Number.isFinite(x) ? x : fallback;
}

function normalizeItemRow(r) {
  return {
    id: r.id,
    categoryId: r.category_id,
    categoryName: r.category_name,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    prepTimeMinutes: r.prep_time_minutes,
    status: r.status, // available|unavailable|sold_out
    imageUrl: r.image_url,
    isChefRecommended: !!r.is_chef_recommended,
    isDeleted: !!r.is_deleted,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

exports.getCategories = async (req, res) => {
  try {
    const { status = "ALL" } = req.query;
    const rows = await repo.listCategories({ status });

    res.json({
      categories: rows.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        displayOrder: c.display_order,
        status: c.status,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
    });
  } catch (e) {
    console.error("getCategories error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const {
      q,
      categoryId,
      status,
      chef,
      sort = "NEWEST",
      page = 1,
      limit = 20,
    } = req.query;

    const { items, total } = await repo.findMenuItems({
      q,
      categoryId,
      status,
      chef,
      sort,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      items: items.map((r) => ({
        id: r.id,
        name: r.name,
        price: Number(r.price),
        status: r.status,
        prepTimeMinutes: r.prep_time_minutes,
        isChefRecommended: r.is_chef_recommended,
        createdAt: r.created_at,
        categoryId: r.category_id,
        categoryName: r.category_name,
        soldCount: Number(r.sold_count),
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getMenuItems error:", err);
    res.status(500).json({ message: "Get menu items failed" });
  }
};

exports.getMenuItemDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await repo.getItemById(id);
    if (!row) return res.status(404).json({ message: "Menu item not found" });

    const modifierGroupIds = await repo.getModifierGroupIds(id);

    res.json({
      item: {
        ...normalizeItemRow(row),
        modifierGroupIds,
      },
    });
  } catch (e) {
    console.error("getMenuItemDetail error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      prepTimeMinutes,
      status,
      imageUrl,
      isChefRecommended,
    } = req.body;

    if (!categoryId || !name || price == null || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const created = await repo.createItem({
      categoryId,
      name,
      description,
      price,
      prepTimeMinutes,
      status,
      imageUrl,
      isChefRecommended,
    });

    res.status(201).json({ id: created.id });
  } catch (e) {
    console.error("createMenuItem error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await repo.updateItem(id, {
      categoryId: req.body.categoryId,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      prepTimeMinutes: req.body.prepTimeMinutes,
      status: req.body.status,
      imageUrl: req.body.imageUrl,
      isChefRecommended: req.body.isChefRecommended,
      isDeleted: req.body.isDeleted,
    });

    if (!updated)
      return res.status(404).json({ message: "Menu item not found" });

    res.json({ message: "Updated", id: updated.id });
  } catch (e) {
    console.error("updateMenuItem error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleChefRecommended = async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;

    if (typeof value !== "boolean") {
      return res.status(400).json({ message: "value must be boolean" });
    }

    const row = await repo.toggleChef(id, value);
    if (!row) return res.status(404).json({ message: "Menu item not found" });

    res.json({ id: row.id, isChefRecommended: row.is_chef_recommended });
  } catch (e) {
    console.error("toggleChefRecommended error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      description = "",
      displayOrder = 0,
      status = "active",
    } = req.body;

    if (!name?.trim())
      return res.status(400).json({ message: "name is required" });

    const row = await repo.createCategory({
      name: name.trim(),
      description,
      displayOrder: Number(displayOrder) || 0,
      status,
    });

    res.status(201).json({ id: row.id });
  } catch (e) {
    console.error("createCategory error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteMenuItem = async (req, res) => {
  console.log(req.params);
  try {
    const { id } = req.params;

    // ✅ chặn xoá nếu item có trong order cancelled/completed
    const locked = await repo.hasItemInLockedOrders(id);
    if (locked) {
      return res.status(409).json({
        message:
          "Không thể xoá: món này đang tồn tại trong order đã CANCELLED hoặc COMPLETED.",
      });
    }

    const row = await repo.softDeleteItem(id);
    if (!row) return res.status(404).json({ message: "Menu item not found" });

    res.json({ message: "Deleted", id: row.id });
  } catch (e) {
    console.error("deleteMenuItem error:", e?.message, e?.detail, e);
    return res.status(500).json({ message: "Server error" });
  }
};
