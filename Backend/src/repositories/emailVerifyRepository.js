const db = require("../config/db");

exports.upsertToken = async ({ userId, tokenHash, expiresAt }) => {
  // mỗi user chỉ giữ 1 token active (đỡ rác)
  await db.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [userId]);

  const rs = await db.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token_hash, expires_at`,
    [userId, tokenHash, expiresAt]
  );
  return rs.rows[0];
};

exports.findValidByHash = async (tokenHash) => {
  const now = new Date(); 

  const query = `
      SELECT * FROM email_verification_tokens 
      WHERE token_hash = $1 
      AND expires_at > $2  
  `;
    
  const { rows } = await pool.query(query, [tokenHash, now]);
  return rows[0] || null;
};

exports.deleteById = async (id) => {
  await db.query("DELETE FROM email_verification_tokens WHERE id = $1", [id]);
};

exports.deleteByUserId = async (userId) => {
  await db.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [userId]);
};
