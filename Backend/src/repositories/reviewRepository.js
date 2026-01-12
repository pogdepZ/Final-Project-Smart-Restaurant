// repositories/reviewRepository.js
const db = require("../config/db");

exports.findReviewsByMenuItemId = async (menuItemId, page = 1, limit = 5) => {
  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 5, 1), 50);
  const offset = (p - 1) * l;

  // 1) total
  const totalRes = await db.query(
    `select count(*)::int as total
     from public.menu_item_reviews
     where menu_item_id = $1`,
    [menuItemId]
  );
  const total = totalRes.rows[0]?.total || 0;

  // 2) data (order mới nhất trước)
  const dataRes = await db.query(
    `select id, user_id, menu_item_id, rating, comment, created_at
     from public.menu_item_reviews
     where menu_item_id = $1
     order by created_at desc
     limit $2 offset $3`,
    [menuItemId, l, offset]
  );

  const totalPages = Math.ceil(total / l);
  const hasMore = p < totalPages;

  return {
    data: dataRes.rows,
    meta: { page: p, limit: l, total, totalPages, hasMore },
  };
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
