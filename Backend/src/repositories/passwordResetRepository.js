const db = require("../config/db");

exports.create = async ({ userId, tokenHash, expiresAt }) => {
  const rs = await db.query(
    `insert into password_reset_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)
     returning id`,
    [userId, tokenHash, expiresAt]
  );
  return rs.rows[0];
};

exports.findValid = async (tokenHash) => {
  const rs = await db.query(
    `select * from password_reset_tokens
     where token_hash = $1
       and used_at is null
       and expires_at > now()
     order by created_at desc
     limit 1`,
    [tokenHash]
  );
  return rs.rows[0] || null;
};

exports.markUsed = async (id) => {
  await db.query(
    `update password_reset_tokens
     set used_at = now()
     where id = $1`,
    [id]
  );
};

// optional: revoke all tokens của user
exports.revokeAllByUserId = async (userId) => {
  await db.query(
    `update password_reset_tokens
     set used_at = now()
     where user_id = $1 and used_at is null`,
    [userId]
  );
};
