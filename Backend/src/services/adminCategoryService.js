// src/services/categoryService.js
const repo = require("../repositories/adminCategoryRepository");

exports.listCategories = (opts) => repo.list(opts);

exports.createCategory = async (payload) => {
  const name = String(payload?.name || "").trim();
  if (!name) {
    const err = new Error("Tên category không được rỗng");
    err.status = 400;
    throw err;
  }
  return repo.create({
    name,
    description: payload?.description ?? null,
    displayOrder: payload?.displayOrder ?? 0,
    status: payload?.status ?? "active",
  });
};

exports.updateCategory = async (id, payload) => {
  const next = { ...payload };
  if (next.name != null) next.name = String(next.name).trim();
  if (next.name === "") {
    const err = new Error("Tên category không được rỗng");
    err.status = 400;
    throw err;
  }
  return repo.updateById(id, next);
};

const db = require("../config/db");
const categoryRepo = require("../repositories/adminCategoryRepository");
const menuItemRepo = require("../repositories/adminMenuRepository"); // bạn tạo repo này

exports.deleteCategory = async (categoryId, { moveToCategoryId } = {}) => {
  if (!moveToCategoryId) {
    const err = new Error(
      "Thiếu moveToCategoryId để chuyển menu items trước khi xoá."
    );
    err.status = 400;
    throw err;
  }
  if (moveToCategoryId === categoryId) {
    const err = new Error("Không thể chuyển sang chính category đang xoá.");
    err.status = 400;
    throw err;
  }

  // ✅ Rule: nếu có order chưa completed chứa món thuộc category này => CHẶN
  // (phải check trước khi reassign)
  const hasActive = await categoryRepo.hasActiveOrders(categoryId);
  if (hasActive) {
    const err = new Error(
      "Không thể xoá category: đang có đơn hàng chưa completed chứa món thuộc category này."
    );
    err.status = 400;
    throw err;
  }

  // ✅ đảm bảo category mới tồn tại & không bị xoá
  const ok = await categoryRepo.existsActive(moveToCategoryId); // bạn thêm hàm này
  if (!ok) {
    const err = new Error("Category thay thế không tồn tại hoặc đã bị xoá.");
    err.status = 400;
    throw err;
  }

  try {
    await db.query("BEGIN");

    // 1) chuyển toàn bộ menu items sang category mới
    await menuItemRepo.moveItemsToCategory(categoryId, moveToCategoryId);

    // 2) soft delete category cũ
    await categoryRepo.softDeleteById(categoryId);

    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
};
