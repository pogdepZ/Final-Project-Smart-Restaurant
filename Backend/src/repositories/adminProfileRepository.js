const db = require("../config/db");

exports.getById = async (id) => {
  const sql = `
    SELECT id, name, email, role, is_verified, created_at, avatar_url
    FROM public.users
    WHERE id = $1
  `;
  const res = await db.query(sql, [id]);
  return res.rows[0];
};

exports.updateName = async ({ id, name }) => {
  const sql = `
    UPDATE public.users
    SET name = $2
    WHERE id = $1
    RETURNING id, name, email, role, is_verified, created_at, avatar_url
  `;
  const res = await db.query(sql, [id, name]);
  return res.rows[0];
};

exports.updateAvatar = async ({ id, avatar_url }) => {
  const sql = `
    UPDATE public.users
    SET avatar_url = $2
    WHERE id = $1
    RETURNING id, name, email, role, is_verified, created_at, avatar_url
  `;
  const res = await db.query(sql, [id, avatar_url]);
  return res.rows[0];
};
