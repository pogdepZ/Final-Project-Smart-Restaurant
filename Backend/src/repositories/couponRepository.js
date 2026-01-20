// src/repositories/couponRepository.js
const db = require("../config/db");

/**
 * Tìm coupon theo code
 */
exports.findByCode = async (code) => {
  const sql = `
    SELECT *
    FROM coupons
    WHERE UPPER(code) = UPPER($1)
    LIMIT 1
  `;
  const result = await db.query(sql, [code]);
  return result.rows[0] || null;
};

/**
 * Tăng số lần sử dụng coupon
 */
exports.incrementUsedCount = async (couponId) => {
  const sql = `
    UPDATE coupons
    SET used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const result = await db.query(sql, [couponId]);
  return result.rows[0] || null;
};

/**
 * Kiểm tra coupon có hợp lệ không
 */
exports.findValidCoupon = async (code) => {
  const sql = `
    SELECT *
    FROM coupons
    WHERE UPPER(code) = UPPER($1)
      AND is_active = true
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
      AND (usage_limit IS NULL OR used_count < usage_limit)
    LIMIT 1
  `;
  const result = await db.query(sql, [code]);
  return result.rows[0] || null;
};

/**
 * Lấy tất cả coupons (cho admin)
 */
exports.findAll = async () => {
  const sql = `
    SELECT *
    FROM coupons
    ORDER BY created_at DESC
  `;
  const result = await db.query(sql);
  return result.rows;
};

/**
 * Tạo coupon mới
 */
exports.create = async (data) => {
  const sql = `
    INSERT INTO coupons (
      code, description, discount_type, discount_value,
      min_order_amount, max_discount_amount, usage_limit,
      start_date, end_date, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const values = [
    data.code,
    data.description || null,
    data.discount_type,
    data.discount_value,
    data.min_order_amount || 0,
    data.max_discount_amount || null,
    data.usage_limit || null,
    data.start_date || new Date(),
    data.end_date || null,
    data.is_active !== false,
  ];
  const result = await db.query(sql, values);
  return result.rows[0];
};

/**
 * Cập nhật coupon
 */
exports.update = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.code !== undefined) {
    fields.push(`code = $${idx++}`);
    values.push(data.code);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.discount_type !== undefined) {
    fields.push(`discount_type = $${idx++}`);
    values.push(data.discount_type);
  }
  if (data.discount_value !== undefined) {
    fields.push(`discount_value = $${idx++}`);
    values.push(data.discount_value);
  }
  if (data.min_order_amount !== undefined) {
    fields.push(`min_order_amount = $${idx++}`);
    values.push(data.min_order_amount);
  }
  if (data.max_discount_amount !== undefined) {
    fields.push(`max_discount_amount = $${idx++}`);
    values.push(data.max_discount_amount);
  }
  if (data.usage_limit !== undefined) {
    fields.push(`usage_limit = $${idx++}`);
    values.push(data.usage_limit);
  }
  if (data.start_date !== undefined) {
    fields.push(`start_date = $${idx++}`);
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push(`end_date = $${idx++}`);
    values.push(data.end_date);
  }
  if (data.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(data.is_active);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const sql = `
    UPDATE coupons
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *
  `;

  const result = await db.query(sql, values);
  return result.rows[0] || null;
};

/**
 * Xóa coupon
 */
exports.remove = async (id) => {
  const sql = `DELETE FROM coupons WHERE id = $1 RETURNING *`;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
};
