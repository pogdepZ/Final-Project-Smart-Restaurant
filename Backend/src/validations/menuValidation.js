// src/validators/menuItemValidator.js

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_SET = new Set(["available", "unavailable", "sold_out"]);

function badRequest(message, field) {
  const err = new Error(message);
  err.status = 400;
  if (field) err.field = field; // optional: FE dùng để highlight field
  throw err;
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return undefined;
}

function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return NaN;
}

function trimOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function trimOrUndef(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

// Giới hạn do DB numeric(12,2) => absolute < 1e10
const MAX_PRICE = 10_000_000_000 - 0.01;

function validateBase(normalized, { requireImageUrl = false } = {}) {
  // categoryId
  if (!normalized.categoryId || normalized.categoryId === "ALL") {
    badRequest("Vui lòng chọn category.", "categoryId");
  }
  if (!UUID_RE.test(normalized.categoryId)) {
    badRequest("Category không hợp lệ.", "categoryId");
  }

  // name
  if (!normalized.name) badRequest("Tên món không được rỗng.", "name");
  if (normalized.name.length > 80) badRequest("Tên món tối đa 80 ký tự.", "name");

  // description
  if (normalized.description && normalized.description.length > 2000) {
    badRequest("Mô tả tối đa 2000 ký tự.", "description");
  }

  // status
  if (!STATUS_SET.has(normalized.status)) {
    badRequest("Trạng thái không hợp lệ.", "status");
  }

  // price
  if (!Number.isFinite(normalized.price)) badRequest("Giá phải là số.", "price");
  if (normalized.price <= 0) badRequest("Giá phải lớn hơn 0.", "price");
  if (normalized.price > MAX_PRICE) badRequest("Giá quá lớn.", "price");

  // prepTimeMinutes
  if (!Number.isFinite(normalized.prepTimeMinutes)) {
    badRequest("Prep time phải là số.", "prepTimeMinutes");
  }
  if (normalized.prepTimeMinutes < 0) {
    badRequest("Prep time không được âm.", "prepTimeMinutes");
  }
  if (normalized.prepTimeMinutes > 240) {
    badRequest("Prep time tối đa 240 phút.", "prepTimeMinutes");
  }

  // isChefRecommended
  if (typeof normalized.isChefRecommended !== "boolean") {
    badRequest("Chef recommended không hợp lệ.", "isChefRecommended");
  }
}

function normalizeCreate(payload = {}) {
  const name = String(payload.name ?? "").trim();
  const status = String(payload.status ?? "").trim().toLowerCase();

  const price = toNumber(payload.price);
  const prepTimeMinutes = toNumber(payload.prepTimeMinutes);

  const imageUrl = trimOrUndef(payload.imageUrl);

  const isChefRecommended = (() => {
    const b = toBool(payload.isChefRecommended);
    return b === undefined ? false : b;
  })();

  return {
    categoryId: String(payload.categoryId ?? "").trim(),
    name,
    description: trimOrNull(payload.description),
    status,
    price,
    prepTimeMinutes: Number.isFinite(prepTimeMinutes) ? prepTimeMinutes : 0,
    imageUrl,
    isChefRecommended,
  };
}

// PATCH: chỉ normalize/validate field nào có gửi lên
function normalizePatch(payload = {}) {
  const out = {};

  if ("categoryId" in payload) out.categoryId = String(payload.categoryId ?? "").trim();
  if ("name" in payload) out.name = String(payload.name ?? "").trim();
  if ("description" in payload) out.description = trimOrNull(payload.description);
  if ("status" in payload) out.status = String(payload.status ?? "").trim().toLowerCase();

  if ("price" in payload) out.price = toNumber(payload.price);
  if ("prepTimeMinutes" in payload) out.prepTimeMinutes = toNumber(payload.prepTimeMinutes);

  if ("imageUrl" in payload) out.imageUrl = trimOrUndef(payload.imageUrl);

  if ("isChefRecommended" in payload) {
    const b = toBool(payload.isChefRecommended);
    out.isChefRecommended = b;
  }

  return out;
}

function validateCreateMenuItem(payload) {
  const normalized = normalizeCreate(payload);
  validateBase(normalized, { requireImageUrl: true });
  return normalized;
}

function validateUpdateMenuItem(patchPayload) {
  const normalized = normalizePatch(patchPayload);

  // validate từng field nếu có
  if ("categoryId" in normalized) {
    if (!normalized.categoryId || normalized.categoryId === "ALL") badRequest("Vui lòng chọn category.", "categoryId");
    if (!UUID_RE.test(normalized.categoryId)) badRequest("Category không hợp lệ.", "categoryId");
  }

  if ("name" in normalized) {
    if (!normalized.name) badRequest("Tên món không được rỗng.", "name");
    if (normalized.name.length > 80) badRequest("Tên món tối đa 80 ký tự.", "name");
  }

  if ("description" in normalized) {
    if (normalized.description && normalized.description.length > 2000) badRequest("Mô tả tối đa 2000 ký tự.", "description");
  }

  if ("status" in normalized) {
    if (!STATUS_SET.has(normalized.status)) badRequest("Trạng thái không hợp lệ.", "status");
  }

  if ("price" in normalized) {
    if (!Number.isFinite(normalized.price)) badRequest("Giá phải là số.", "price");
    if (normalized.price <= 0) badRequest("Giá phải lớn hơn 0.", "price");
    if (normalized.price > MAX_PRICE) badRequest("Giá quá lớn.", "price");
  }

  if ("prepTimeMinutes" in normalized) {
    if (!Number.isFinite(normalized.prepTimeMinutes)) badRequest("Prep time phải là số.", "prepTimeMinutes");
    if (normalized.prepTimeMinutes < 0) badRequest("Prep time không được âm.", "prepTimeMinutes");
    if (normalized.prepTimeMinutes > 240) badRequest("Prep time tối đa 240 phút.", "prepTimeMinutes");
  }

  if ("imageUrl" in normalized) {
    // edit: không bắt buộc, nhưng nếu gửi thì phải là string non-empty
    // (tối giản: chỉ trim)
    // nếu bạn muốn check URL format thì mình thêm regex sau
  }

  if ("isChefRecommended" in normalized) {
    if (typeof normalized.isChefRecommended !== "boolean") badRequest("Chef recommended không hợp lệ.", "isChefRecommended");
  }

  if (Object.keys(normalized).length === 0) {
    badRequest("Không có dữ liệu để cập nhật.");
  }

  return normalized;
}

module.exports = {
  validateCreateMenuItem,
  validateUpdateMenuItem,
};
