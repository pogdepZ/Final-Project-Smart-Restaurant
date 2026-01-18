const db = require("../config/db"); // db hoặc client tuỳ bạn

exports.listGroupsWithOptions = async ({ status = "active" } = {}) => {
  const params = [];
  let where = "";

  if (status && status !== "ALL") {
    params.push(status);
    where = `WHERE g.status = $${params.length}`;
  }

  const sql = `
    SELECT
      g.id AS group_id,
      g.name AS group_name,
      g.selection_type,
      g.is_required,
      g.min_selections,
      g.max_selections,
      g.display_order,
      g.status AS group_status,
      g.created_at AS group_created_at,
      g.updated_at AS group_updated_at,

      o.id AS option_id,
      o.name AS option_name,
      o.price_adjustment,
      o.status AS option_status,
      o.created_at AS option_created_at
    FROM modifier_groups g
    LEFT JOIN modifier_options o
      ON o.group_id = g.id
      AND o.status = 'active'
    ${where}
    ORDER BY g.display_order ASC, g.created_at DESC, o.created_at ASC
  `;

  const { rows } = await db.query(sql, params);
  return rows;
};

function parseIntSafe(v, fallback) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeStatusQuery(v) {
  const s = String(v || "").toLowerCase();
  if (s === "active" || s === "inactive") return s;
  return "";
}

function normalizeSelectionTypeQuery(v) {
  const s = String(v || "").toLowerCase();
  if (s === "single" || s === "multiple") return s;
  return "";
}

exports.listGroups = async (query) => {
  const q = (query.q || "").trim();
  const status = normalizeStatusQuery(query.status);
  const selectionType = normalizeSelectionTypeQuery(query.selection_type);
  const sort = String(query.sort || "NEWEST").toUpperCase();

  const page = parseIntSafe(query.page, 1);
  const limit = Math.min(parseIntSafe(query.limit, 20), 200);
  const offset = (page - 1) * limit;

  const where = [];
  const values = [];
  let idx = 1;

  if (q) {
    where.push(`g.name ILIKE $${idx}`);
    values.push(`%${q}%`);
    idx++;
  }
  if (status) {
    where.push(`g.status = $${idx}`);
    values.push(status);
    idx++;
  }
  if (selectionType) {
    where.push(`g.selection_type = $${idx}`);
    values.push(selectionType);
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  let orderBy = "g.created_at DESC";
  if (sort === "OLDEST") orderBy = "g.created_at ASC";
  if (sort === "NAME_ASC") orderBy = "g.name ASC";
  if (sort === "NAME_DESC") orderBy = "g.name DESC";
  if (sort === "ORDER_ASC") orderBy = "g.display_order ASC, g.created_at DESC";

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM public.modifier_groups g
    ${whereSql}
  `;

  const dataSql = `
    SELECT
      g.id, g.name, g.selection_type, g.is_required,
      g.min_selections, g.max_selections,
      g.display_order, g.status,
      g.created_at, g.updated_at,
      COALESCE(o.cnt, 0)::int AS options_count
    FROM public.modifier_groups g
    LEFT JOIN (
      SELECT group_id, COUNT(*)::int AS cnt
      FROM public.modifier_options
      GROUP BY group_id
    ) o ON o.group_id = g.id
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  try {
    const countRes = await db.query(countSql, values);
    const total = countRes.rows?.[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const dataRes = await db.query(dataSql, [...values, limit, offset]);

    return {
      items: dataRes.rows || [],
      pagination: { page, limit, total, totalPages },
    };
  } finally {
  }
};

exports.getGroupById = async (id) => {
  const sql = `
    SELECT id, name, selection_type, is_required,
           min_selections, max_selections, display_order,
           status, created_at, updated_at
    FROM public.modifier_groups
    WHERE id = $1
  `;
  const res = await db.query(sql, [id]);
  return res.rows?.[0] || null;
};

exports.createGroup = async (payload) => {
  const sql = `
    INSERT INTO public.modifier_groups
      (name, selection_type, is_required, min_selections, max_selections, display_order, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, name, selection_type, is_required, min_selections, max_selections, display_order, status, created_at, updated_at
  `;
  const res = await db.query(sql, [
    payload.name,
    payload.selection_type,
    payload.is_required,
    payload.min_selections,
    payload.max_selections,
    payload.display_order,
    payload.status,
  ]);
  return res.rows[0];
};

exports.updateGroup = async (id, payload) => {
  const sql = `
    UPDATE public.modifier_groups
    SET name = $2,
        selection_type = $3,
        is_required = $4,
        min_selections = $5,
        max_selections = $6,
        display_order = $7,
        status = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, selection_type, is_required, min_selections, max_selections, display_order, status, created_at, updated_at
  `;
  const res = await db.query(sql, [
    id,
    payload.name,
    payload.selection_type,
    payload.is_required,
    payload.min_selections,
    payload.max_selections,
    payload.display_order,
    payload.status,
  ]);
  return res.rows?.[0] || null;
};

exports.deleteGroup = async (id) => {
  const sql = `
    DELETE FROM public.modifier_groups
    WHERE id = $1
    RETURNING id, name
  `;
  const res = await db.query(sql, [id]);
  return res.rows?.[0] || null;
};

// OPTIONS
exports.listOptionsByGroup = async (groupId) => {
  const sql = `
    SELECT id, group_id, name, price_adjustment, status, created_at
    FROM public.modifier_options
    WHERE group_id = $1
    ORDER BY created_at DESC
  `;
  const res = await db.query(sql, [groupId]);
  return res.rows || [];
};

exports.getOptionById = async (id) => {
  const sql = `
    SELECT id, group_id, name, price_adjustment, status, created_at
    FROM public.modifier_options
    WHERE id = $1
  `;
  const res = await db.query(sql, [id]);
  return res.rows?.[0] || null;
};

exports.createOption = async (payload) => {
  const sql = `
    INSERT INTO public.modifier_options (group_id, name, price_adjustment, status)
    VALUES ($1,$2,$3,$4)
    RETURNING id, group_id, name, price_adjustment, status, created_at
  `;
  const res = await db.query(sql, [
    payload.group_id,
    payload.name,
    payload.price_adjustment,
    payload.status,
  ]);
  return res.rows[0];
};

exports.updateOption = async (id, payload) => {
  const sql = `
    UPDATE public.modifier_options
    SET name = $2,
        price_adjustment = $3,
        status = $4
    WHERE id = $1
    RETURNING id, group_id, name, price_adjustment, status, created_at
  `;
  const res = await db.query(sql, [
    id,
    payload.name,
    payload.price_adjustment,
    payload.status,
  ]);
  return res.rows?.[0] || null;
};

exports.deleteOption = async (id) => {
  const sql = `
    DELETE FROM public.modifier_options
    WHERE id = $1
    RETURNING id, group_id, name
  `;
  const res = await db.query(sql, [id]);
  return res.rows?.[0] || null;
};
