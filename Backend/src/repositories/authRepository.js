// src/repositories/authRepository.js
const db = require("../config/db");

exports.findUserByEmail = async (email) => {
  const rs = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return rs.rows[0] || null;
};

exports.findUserById = async (id) => {
  const rs = await db.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [id]
  );
  return rs.rows[0] || null;
};


exports.findUserPublicByEmail = async (email) => {
  const rs = await db.query("SELECT id, name, email, role FROM users WHERE email = $1", [email]);
  return rs.rows[0] || null;
};

exports.createUser = async ({ name, email, hashedPassword, role }) => {
  const rs = await db.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
    [name, email, hashedPassword, role]
  );
  return rs.rows[0];
};

exports.markUserVerified = async (userId) => {
  await db.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [userId]);
};

exports.updatePasswordById = async (id, hashedPassword) => {
  await db.query(
    "update users set password = $1 where id = $2",
    [hashedPassword, id]
  );
};
