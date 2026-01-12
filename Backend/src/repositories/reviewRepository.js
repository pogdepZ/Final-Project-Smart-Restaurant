// repositories/reviewRepository.js
const db = require("../config/db");

exports.findReviewsByMenuItemId = async (menuItemId, limit, offset) => {
  const sql = `
    SELECT r.*, u.full_name, u.avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.menu_item_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(sql, [menuItemId, limit, offset]);
  return result.rows;
};

exports.countReviewsByMenuItemId = async (menuItemId) => {
  const sql = `SELECT COUNT(*)::int AS total FROM reviews WHERE menu_item_id = $1`;
  const result = await db.query(sql, [menuItemId]);
  return result.rows[0]?.total ?? 0;
};

exports.findReviewByUserAndItem = async (userId, menuItemId) => {
  const sql = `SELECT * FROM reviews WHERE user_id = $1 AND menu_item_id = $2 LIMIT 1`;
  const result = await db.query(sql, [userId, menuItemId]);
  return result.rows[0] || null;
};

exports.insertReview = async (reviewData) => {
  const sql = `
    INSERT INTO reviews (user_id, menu_item_id, rating, comment, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  const result = await db.query(sql, [
    reviewData.user_id,
    reviewData.menu_item_id,
    reviewData.rating,
    reviewData.comment,
  ]);
  return result.rows[0];
};

exports.checkUserPurchasedItem = async (userId, menuItemId) => {
  const sql = `
    SELECT 1
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = $1
      AND oi.menu_item_id = $2
      AND o.status IN ('COMPLETED', 'DELIVERED')
    LIMIT 1
  `;
  const result = await db.query(sql, [userId, menuItemId]);
  return result.rows.length > 0;
};
