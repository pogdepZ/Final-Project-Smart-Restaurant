const db = require("../config/db");

exports.create = async ({ userId, tokenHash, expiresAt }) => {
  const rs = await db.query(
    `insert into refresh_tokens (user_id, token, expires_at)
     values ($1, $2, $3)
     returning id`,
    [userId, tokenHash, expiresAt]
  );
  return rs.rows[0];
};

exports.findValid = async (tokenHash) => {
  const rs = await db.query(
    `select * from refresh_tokens
     where token = $1 and revoked = false and expires_at > now()`,
    [tokenHash]
  );
  return rs.rows[0] || null;
};

exports.revokeById = async (id) => {
  await db.query(
    `update refresh_tokens set revoked = true where id = $1`,
    [id]
  );
};
