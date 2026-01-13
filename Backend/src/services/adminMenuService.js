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
    status: r.status,
    imageUrl: r.image_url,
    isChefRecommended: !!r.is_chef_recommended,
    isDeleted: !!r.is_deleted,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

exports.getCategories = async (query) => {
  const { status = "ALL" } = query || {};
  const rows = await repo.listCategories({ status });

  return {
    categories: rows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      displayOrder: c.display_order,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    })),
  };
};

exports.getMenuItems = async (query) => {
  const q = query?.q;
  const categoryId = query?.categoryId;
  const status = query?.status;
  const chef = query?.chef;
  const sort = query?.sort || "NEWEST";

  const page = toInt(query?.page, 1);
  const limit = toInt(query?.limit, 20);

  const { items, total } = await repo.findMenuItems({
    q,
    categoryId,
    status,
    chef,
    sort,
    page,
    limit,
  });

  return {
    items: (items || []).map((r) => ({
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
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getMenuItemDetail = async (id) => {
  const row = await repo.getItemById(id);
  if (!row) return null;

  const modifierGroupIds = await repo.getModifierGroupIds(id);

  return {
    item: {
      ...normalizeItemRow(row),
      modifierGroupIds,
    },
  };
};

exports.createMenuItem = async (body) => {
  const {
    categoryId,
    name,
    description,
    price,
    prepTimeMinutes,
    status,
    imageUrl,
    isChefRecommended,
  } = body || {};

  if (!categoryId || !name || price == null || !status) {
    const err = new Error("Missing required fields");
    err.status = 400;
    throw err;
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

  return { id: created.id };
};

exports.updateMenuItem = async (id, body) => {
  const updated = await repo.updateItem(id, {
    categoryId: body?.categoryId,
    name: body?.name,
    description: body?.description,
    price: body?.price,
    prepTimeMinutes: body?.prepTimeMinutes,
    status: body?.status,
    imageUrl: body?.imageUrl,
    isChefRecommended: body?.isChefRecommended,
    isDeleted: body?.isDeleted,
  });

  return updated; // null nếu not found
};

exports.toggleChefRecommended = async (id, body) => {
  const { value } = body || {};
  if (typeof value !== "boolean") {
    const err = new Error("value must be boolean");
    err.status = 400;
    throw err;
  }

  const row = await repo.toggleChef(id, value);
  return row; // null nếu not found
};

exports.createCategory = async (body) => {
  const {
    name,
    description = "",
    displayOrder = 0,
    status = "active",
  } = body || {};

  if (!name?.trim()) {
    const err = new Error("name is required");
    err.status = 400;
    throw err;
  }

  const row = await repo.createCategory({
    name: name.trim(),
    description,
    displayOrder: Number(displayOrder) || 0,
    status,
  });

  return { id: row.id };
};

exports.deleteMenuItem = async (id) => {
  // chặn xoá nếu item có trong order cancelled/completed
  const locked = await repo.hasItemInLockedOrders(id);
  if (locked) {
    const err = new Error(
      "Không thể xoá: món này đang tồn tại trong order đã CANCELLED hoặc COMPLETED."
    );
    err.status = 409;
    throw err;
  }

  const row = await repo.softDeleteItem(id);
  return row; // null nếu not found
};

const isUuid = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );

exports.setMenuItemModifierGroups = async (menuItemId, body) => {
  if (!isUuid(menuItemId)) {
    const err = new Error("Invalid menuItemId");
    err.status = 400;
    throw err;
  }

  const groupIdsRaw = body?.groupIds;
  const groupIds = Array.isArray(groupIdsRaw) ? groupIdsRaw : [];

  // validate uuids
  for (const gid of groupIds) {
    if (!isUuid(gid)) {
      const err = new Error("groupIds must be uuid array");
      err.status = 400;
      throw err;
    }
  }

  const exists = await repo.menuItemExists(menuItemId);
  if (!exists) {
    const err = new Error("Menu item not found");
    err.status = 404;
    throw err;
  }

  await repo.replaceMenuItemGroups(menuItemId, groupIds);

  return { menuItemId, groupIds };
};
