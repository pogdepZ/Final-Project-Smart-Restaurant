const repo = require("../repositories/adminModifierRepository");

exports.getModifierGroups = async (query) => {
  const status = query?.status || "active";
  const rows = await repo.listGroupsWithOptions({ status });

  // group rows -> nested JSON
  const map = new Map();

  for (const r of rows) {
    if (!map.has(r.group_id)) {
      map.set(r.group_id, {
        id: r.group_id,
        name: r.group_name,
        selectionType: r.selection_type,
        isRequired: !!r.is_required,
        minSelections: r.min_selections ?? 0,
        maxSelections: r.max_selections ?? 0,
        displayOrder: r.display_order ?? 0,
        status: r.group_status,
        createdAt: r.group_created_at,
        updatedAt: r.group_updated_at,
        options: [],
      });
    }

    if (r.option_id) {
      map.get(r.group_id).options.push({
        id: r.option_id,
        name: r.option_name,
        priceAdjustment: Number(r.price_adjustment ?? 0),
        status: r.option_status,
        createdAt: r.option_created_at,
      });
    }
  }

  return { groups: Array.from(map.values()) };
};

function makeErr(message, statusCode = 400) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function normalizeStatusStrict(v, field = "status") {
  const s = String(v || "").toLowerCase();
  if (s !== "active" && s !== "inactive") throw makeErr(`${field} không hợp lệ`);
  return s;
}

function normalizeSelectionTypeStrict(v) {
  const s = String(v || "").toLowerCase();
  if (s !== "single" && s !== "multiple") throw makeErr("selection_type không hợp lệ");
  return s;
}

function toInt(v, fallback = 0) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// -------- GROUP VALIDATION --------
function validateGroupBody(body) {
  const name = (body.name || "").trim();
  if (!name) throw makeErr("Thiếu name");
  if (name.length > 80) throw makeErr("name tối đa 80 ký tự");

  const selection_type = normalizeSelectionTypeStrict(body.selection_type);
  const is_required = !!body.is_required;

  const min_selections = toInt(body.min_selections, 0);
  const max_selections = toInt(body.max_selections, 0);
  const display_order = toInt(body.display_order, 0);
  const status = body.status ? normalizeStatusStrict(body.status) : "active";

  if (min_selections < 0 || max_selections < 0) throw makeErr("min/max phải >= 0");
  if (max_selections && min_selections > max_selections) throw makeErr("min_selections > max_selections");

  // single => max <= 1 (rule rất thực tế)
  if (selection_type === "single" && max_selections > 1) {
    throw makeErr("selection_type=single thì max_selections không được > 1");
  }

  return {
    name,
    selection_type,
    is_required,
    min_selections,
    max_selections,
    display_order,
    status,
  };
}

// -------- OPTION VALIDATION --------
function validateOptionCreate(body) {
  const group_id = String(body.group_id || "").trim();
  if (!group_id) throw makeErr("Thiếu group_id");

  const name = (body.name || "").trim();
  if (!name) throw makeErr("Thiếu name");
  if (name.length > 80) throw makeErr("name tối đa 80 ký tự");

  const price_adjustment = toNumber(body.price_adjustment, 0);
  if (price_adjustment < 0) throw makeErr("price_adjustment phải >= 0");

  const status = body.status ? normalizeStatusStrict(body.status) : "active";

  return { group_id, name, price_adjustment, status };
}

// -------- PUBLIC SERVICES --------
exports.getGroups = async (query) => {
  return repo.listGroups(query);
};

exports.getGroupDetail = async (groupId) => {
  const group = await repo.getGroupById(groupId);
  if (!group) throw makeErr("Không tìm thấy modifier group", 404);

  const options = await repo.listOptionsByGroup(groupId);
  return { group, options };
};

exports.createGroup = async (body) => {
  const payload = validateGroupBody(body);
  try {
    return await repo.createGroup(payload);
  } catch (e) {
    if (e.code === "23514") throw makeErr("Check constraint failed (selection_type/status)", 400);
    throw e;
  }
};

exports.updateGroup = async (groupId, body) => {
  const payload = validateGroupBody(body);
  try {
    const updated = await repo.updateGroup(groupId, payload);
    if (!updated) throw makeErr("Không tìm thấy modifier group", 404);
    return updated;
  } catch (e) {
    if (e.code === "23514") throw makeErr("Check constraint failed (selection_type/status)", 400);
    throw e;
  }
};

exports.deleteGroup = async (groupId) => {
  const deleted = await repo.deleteGroup(groupId);
  if (!deleted) throw makeErr("Không tìm thấy modifier group", 404);
  // options CASCADE theo FK
  return deleted;
};

// OPTIONS
exports.createOption = async (body) => {
  const payload = validateOptionCreate(body);

  const group = await repo.getGroupById(payload.group_id);
  if (!group) throw makeErr("group_id không tồn tại", 400);

  try {
    return await repo.createOption(payload);
  } catch (e) {
    if (e.code === "23514") throw makeErr("Check constraint failed (status/price_adjustment)", 400);
    if (e.code === "23503") throw makeErr("group_id không tồn tại (FK)", 400);
    throw e;
  }
};

exports.updateOption = async (optionId, body) => {
  const current = await repo.getOptionById(optionId);
  if (!current) throw makeErr("Không tìm thấy option", 404);

  const name = ((body.name ?? current.name) || "").trim();
  if (!name) throw makeErr("Thiếu name");
  if (name.length > 80) throw makeErr("name tối đa 80 ký tự");

  const price_adjustment =
    body.price_adjustment !== undefined ? toNumber(body.price_adjustment, Number(current.price_adjustment)) : Number(current.price_adjustment);
  if (!Number.isFinite(price_adjustment) || price_adjustment < 0) throw makeErr("price_adjustment phải >= 0");

  const status = body.status ? normalizeStatusStrict(body.status) : current.status;

  try {
    const updated = await repo.updateOption(optionId, { name, price_adjustment, status });
    if (!updated) throw makeErr("Không tìm thấy option", 404);
    return updated;
  } catch (e) {
    if (e.code === "23514") throw makeErr("Check constraint failed (status/price_adjustment)", 400);
    throw e;
  }
};

exports.deleteOption = async (optionId) => {
  const deleted = await repo.deleteOption(optionId);
  if (!deleted) throw makeErr("Không tìm thấy option", 404);
  return deleted;
};