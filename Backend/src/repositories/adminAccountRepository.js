// src/repositories/adminAccountRepo.js
const db = require("../config/db");

/**
 * Repo layer:
 * - Chỉ chứa SQL + params + trả rows
 * - Không validate quyền / business logic / hash password
 */

exports.countUsers = async ({ whereSql, values }) => {
  const sql = `
    SELECT COUNT(*)::int AS total
    FROM public.users u
    ${whereSql}
  `;
  const res = await db.query(sql, values);
  return res.rows?.[0]?.total ?? 0;
};

exports.findUsers = async ({ whereSql, values, orderBy, limit, offset }) => {
  const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.is_verified,
      u.is_actived,
      u.created_at,
      u.avatar_url,
      u.preferences
    FROM public.users u
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  const res = await db.query(sql, [...values, limit, offset]);
  return res.rows || [];
};

exports.insertUser = async ({
  name,
  email,
  passwordHash,
  role,
  is_verified,
}) => {
  const sql = `
    INSERT INTO public.users (name, email, password, role, is_verified)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, role, is_verified, created_at
  `;
  const res = await db.query(sql, [
    name,
    email,
    passwordHash,
    role,
    is_verified,
  ]);
  return res.rows?.[0] || null;
};

exports.updateVerified = async ({ id, is_verified }) => {
  const sql = `
    UPDATE public.users
    SET is_verified = $2
    WHERE id = $1
    RETURNING id, name, email, role, is_verified, created_at
  `;
  const res = await db.query(sql, [id, is_verified]);
  return res.rows?.[0] || null;
};

exports.findByIdBasic = async (id) => {
  const sql = `SELECT id, role, email, name FROM public.users WHERE id = $1`;
  const res = await db.query(sql, [id]);
  return res.rows?.[0] || null;
};

exports.deleteById = async (id) => {
  const sql = `
    DELETE FROM public.users
    WHERE id = $1
    RETURNING id, name, email, role
  `;
  const res = await db.query(sql, [id]);
  return res.rows?.[0] || null;
};

exports.updateActived = async ({ id, is_actived }) => {
  const sql = `
    UPDATE public.users
    SET is_actived = $2
    WHERE id = $1
    RETURNING id, name, email, role, is_verified, is_actived, created_at
  `;
  const res = await db.query(sql, [id, is_actived]);
  return res.rows?.[0] || null;
};

exports.findById = async (id) => {
  const sql = `
    SELECT
      id,
      name,
      email,
      role,
      is_verified,
      created_at,
      preferences,
      avatar_url,
      is_actived
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const r = await db.query(sql, [id]);
  return r.rows[0] || null;
};

exports.updateAccount = async (id, patch = {}) => {
  // patch: { name?, role? }
  const allowedFields = new Set(["name", "role"]);
  const entries = Object.entries(patch).filter(([k]) => allowedFields.has(k));

  if (entries.length === 0) return null;

  const sets = [];
  const params = [];
  let i = 1;

  for (const [k, v] of entries) {
    sets.push(`${k} = $${i++}`);
    params.push(v);
  }

  params.push(id);

  const sql = `
    UPDATE users
    SET ${sets.join(", ")}
    WHERE id = $${i}
    RETURNING
      id,
      name,
      email,
      role,
      is_verified,
      created_at,
      preferences,
      avatar_url,
      is_actived
  `;

  const r = await db.query(sql, params);
  return r.rows[0] || null;
};
