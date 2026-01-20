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
const menuItemRepo = require("../repositories/adminMenuRepository");

exports.deleteCategory = async (categoryId, { moveToCategoryId } = {}) => {
  // 0) Đếm xem category có món không
  const itemsCount = await menuItemRepo.countItemsByCategory(categoryId);

  // ✅ Không có món => xoá luôn, không cần moveToCategoryId
  if (Number(itemsCount) === 0) {
    await categoryRepo.softDeleteById(categoryId);
    return { message: "Đã xoá category" };
  }

  // 1) Có món => check active orders trước
  const hasActive = await categoryRepo.hasActiveOrders(categoryId);
  if (hasActive) {
    const err = new Error(
      "Không thể xoá category: đang có đơn hàng chưa hoàn tất chứa món thuộc category này.",
    );
    err.status = 400;
    throw err;
  }

  // 2) Có món nhưng không có active orders => cần category thay thế
  if (!moveToCategoryId) {
    const err = new Error(
      "Category này còn món. Vui lòng chọn category thay thế để chuyển món trước khi xoá.",
    );
    err.status = 400;
    throw err;
  }

  if (moveToCategoryId === categoryId) {
    const err = new Error("Không thể chuyển sang chính category đang xoá.");
    err.status = 400;
    throw err;
  }

  // 3) đảm bảo category thay thế tồn tại & chưa bị xoá
  const ok = await categoryRepo.existsActive(moveToCategoryId);
  if (!ok) {
    const err = new Error("Category thay thế không tồn tại hoặc đã bị xoá.");
    err.status = 400;
    throw err;
  }

  // 4) Transaction: chuyển món rồi xoá category
  try {
    await db.query("BEGIN");

    await menuItemRepo.moveItemsToCategory(categoryId, moveToCategoryId);
    await categoryRepo.softDeleteById(categoryId);

    await db.query("COMMIT");
    return { message: "Đã chuyển món và xoá category" };
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
};
