// src/services/adminAccountService.js
const bcrypt = require("bcryptjs");
const adminAccountRepo = require("../repositories/adminAccountRepository");

const STAFF_ROLES = new Set(["admin", "waiter", "kitchen", "superadmin"]);

function parseIntSafe(v, fallback) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeScope(scope) {
  const s = String(scope || "").toUpperCase();
  return s === "STAFF" ? "STAFF" : "USER";
}

function mapSortToOrderBy(sort) {
  const s = String(sort || "NEWEST")
    .trim()
    .toUpperCase();
  if (s === "OLDEST") return "u.created_at ASC";
  if (s === "NAME_ASC") return "u.name ASC";
  if (s === "NAME_DESC") return "u.name DESC";
  return "u.created_at DESC";
}

function buildWhere({ scope, q, role, verified }) {
  const where = [];
  const values = [];
  let idx = 1;

  // scope filter
  if (scope === "STAFF") {
    where.push(`u.role = ANY($${idx}::text[])`);
    values.push(["admin", "waiter", "kitchen", "superadmin"]);
    idx++;
  } else {
    where.push(`u.role = 'customer'`);
  }

  if (q) {
    where.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }

  if (role) {
    where.push(`u.role = $${idx}`);
    values.push(role);
    idx++;
  }

  if (verified === "true" || verified === "false") {
    where.push(`u.is_verified = $${idx}`);
    values.push(verified === "true");
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, values };
}

/**
 * GET /admin/accounts
 */
exports.getAccounts = async (query) => {
  const scope = normalizeScope(query.scope);
  const q = (query.q || "").trim();
  const role = (query.role || "").trim(); // optional
  const verified = (query.verified || "").trim(); // "true"/"false"
  const orderBy = mapSortToOrderBy(query.sort);

  const page = parseIntSafe(query.page, 1);
  const limit = Math.min(parseIntSafe(query.limit, 20), 100);
  const offset = (page - 1) * limit;

  const { whereSql, values } = buildWhere({ scope, q, role, verified });

  const total = await adminAccountRepo.countUsers({ whereSql, values });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const items = await adminAccountRepo.findUsers({
    whereSql,
    values,
    orderBy,
    limit,
    offset,
  });

  return {
    items,
    pagination: { page, limit, total, totalPages },
  };
};

/**
 * POST /admin/accounts/staff
 */
exports.createStaffAccount = async (body, currentUser) => {
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const password = String(body.password || "");
  const role = String(body.role || "").trim();
  const is_verified = body.is_verified === false ? false : true;

  if (!name || !email || !password) {
    const err = new Error("Thiếu name/email/password");
    err.statusCode = 400;
    throw err;
  }

  if (!STAFF_ROLES.has(role) || role === "customer") {
    const err = new Error("Role không hợp lệ cho staff");
    err.statusCode = 400;
    throw err;
  }

  if (role === "superadmin" && currentUser?.role !== "superadmin") {
    const err = new Error("Chỉ superadmin mới được tạo tài khoản superadmin");
    err.statusCode = 403;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const created = await adminAccountRepo.insertUser({
      name,
      email,
      passwordHash,
      role,
      is_verified,
    });
    return created;
  } catch (e) {
    // duplicate email
    if (e.code === "23505") {
      const err = new Error("Email đã tồn tại");
      err.statusCode = 409;
      throw err;
    }
    // role check fail
    if (e.code === "23514") {
      const err = new Error("Role không hợp lệ (check constraint)");
      err.statusCode = 400;
      throw err;
    }
    throw e;
  }
};

/**
 * PATCH /admin/accounts/:id/verified
 */
exports.setVerified = async (id, is_verified) => {
  if (!id) {
    const err = new Error("Thiếu id");
    err.statusCode = 400;
    throw err;
  }

  const next = !!is_verified;

  const updated = await adminAccountRepo.updateVerified({
    id,
    is_verified: next,
  });
  if (!updated) {
    const err = new Error("Không tìm thấy user");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

/**
 * DELETE /admin/accounts/:id
 */
exports.deleteAccount = async (id, currentUser) => {
  if (!id) {
    const err = new Error("Thiếu id");
    err.statusCode = 400;
    throw err;
  }

  if (currentUser?.id && currentUser.id === id) {
    const err = new Error("Không thể xoá chính mình");
    err.statusCode = 400;
    throw err;
  }

  const target = await adminAccountRepo.findByIdBasic(id);
  if (!target) {
    const err = new Error("Không tìm thấy user");
    err.statusCode = 404;
    throw err;
  }

  if (target.role === "superadmin" && currentUser?.role !== "superadmin") {
    const err = new Error("Chỉ superadmin mới được xoá superadmin");
    err.statusCode = 403;
    throw err;
  }

  const deleted = await adminAccountRepo.deleteById(id);
  return deleted;
};

exports.setActived = async ({ id, is_actived }) => {
  if (!id) {
    const err = new Error("Missing user id");
    err.status = 400;
    throw err;
  }

  if (typeof is_actived !== "boolean") {
    const err = new Error("is_actived must be boolean");
    err.status = 400;
    throw err;
  }

  const basic = await adminAccountRepo.findByIdBasic(id);
  if (!basic) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const updated = await adminAccountRepo.updateActived({ id, is_actived });
  if (!updated) {
    const err = new Error("Cannot update is_actived");
    err.status = 400;
    throw err;
  }

  return updated;
};

const ALLOWED_ROLES = new Set(["admin", "waiter", "kitchen", "customer"]);

function badRequest(publicMessage) {
  const e = new Error(publicMessage);
  e.status = 400;
  e.publicMessage = publicMessage;
  return e;
}

function forbidden(publicMessage) {
  const e = new Error(publicMessage);
  e.status = 403;
  e.publicMessage = publicMessage;
  return e;
}

function notFound(publicMessage) {
  const e = new Error(publicMessage);
  e.status = 404;
  e.publicMessage = publicMessage;
  return e;
}

exports.updateAccount = async (id, { name, role }) => {
  if (!id) throw badRequest("Thiếu id tài khoản");

  const current = await adminAccountRepo.findById(id);
  if (!current) throw notFound("Tài khoản không tồn tại");

  // ❌ Không cho sửa customer
  if (String(current.role || "").toLowerCase() === "customer") {
    throw forbidden("Tài khoản customer không thể chỉnh sửa");
  }

  // Validate payload (cho phép patch partial)
  const patch = {};

  if (name !== undefined) {
    const trimmed = String(name || "").trim();
    if (!trimmed) throw badRequest("Tên không hợp lệ");
    if (trimmed.length > 80) throw badRequest("Tên quá dài (tối đa 80 ký tự)");
    patch.name = trimmed;
  }

  if (role !== undefined) {
    const nextRole = String(role || "").toLowerCase();
    if (!ALLOWED_ROLES.has(nextRole)) {
      throw badRequest("Role không hợp lệ");
    }
    patch.role = nextRole;
  }

  if (Object.keys(patch).length === 0) {
    throw badRequest("Không có dữ liệu để cập nhật");
  }

  const updated = await adminAccountRepo.updateAccount(id, patch);
  return updated;
};
