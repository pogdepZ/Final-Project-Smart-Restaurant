// src/services/couponService.js
const repo = require("../repositories/couponRepository");

/**
 * Validate coupon code và tính toán giảm giá
 * @param {string} code - Mã coupon
 * @param {number} orderAmount - Tổng tiền đơn hàng (subtotal)
 * @returns {Object} Thông tin coupon và số tiền giảm
 */
exports.validateCoupon = async (code, orderAmount = 0) => {
  if (!code || typeof code !== "string") {
    const err = new Error("Vui lòng nhập mã giảm giá");
    err.status = 400;
    throw err;
  }

  const coupon = await repo.findValidCoupon(code.trim());

  if (!coupon) {
    const err = new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
    err.status = 400;
    throw err;
  }

  // Kiểm tra đơn hàng tối thiểu
  const minOrder = Number(coupon.min_order_amount) || 0;
  if (orderAmount < minOrder) {
    const err = new Error(
      `Đơn hàng tối thiểu ${minOrder.toLocaleString("vi-VN")}đ để sử dụng mã này`
    );
    err.status = 400;
    throw err;
  }

  // Tính số tiền giảm
  let discountAmount = 0;
  const discountValue = Number(coupon.discount_value);

  if (coupon.discount_type === "percent") {
    discountAmount = (orderAmount * discountValue) / 100;

    // Áp dụng giới hạn giảm tối đa
    const maxDiscount = Number(coupon.max_discount_amount);
    if (maxDiscount && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }
  } else if (coupon.discount_type === "fixed") {
    discountAmount = discountValue;

    // Không giảm quá tổng đơn
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: discountValue,
      min_order_amount: minOrder,
      max_discount_amount: Number(coupon.max_discount_amount) || null,
    },
    discount_amount: Math.round(discountAmount),
    message: `Áp dụng thành công! Giảm ${discountAmount.toLocaleString("vi-VN")}đ`,
  };
};

/**
 * Sử dụng coupon (tăng used_count)
 */
exports.useCoupon = async (couponId) => {
  return await repo.incrementUsedCount(couponId);
};

/**
 * Lấy tất cả coupons (admin)
 */
exports.getAllCoupons = async () => {
  const coupons = await repo.findAll();
  return {
    items: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      min_order_amount: Number(c.min_order_amount),
      max_discount_amount: c.max_discount_amount
        ? Number(c.max_discount_amount)
        : null,
      usage_limit: c.usage_limit,
      used_count: c.used_count,
      start_date: c.start_date,
      end_date: c.end_date,
      is_active: c.is_active,
      created_at: c.created_at,
    })),
  };
};

/**
 * Tạo coupon mới (admin)
 */
exports.createCoupon = async (data) => {
  // Validate
  if (!data.code) {
    const err = new Error("Mã coupon không được để trống");
    err.status = 400;
    throw err;
  }
  if (!["percent", "fixed"].includes(data.discount_type)) {
    const err = new Error("Loại giảm giá phải là 'percent' hoặc 'fixed'");
    err.status = 400;
    throw err;
  }
  if (!data.discount_value || data.discount_value <= 0) {
    const err = new Error("Giá trị giảm phải lớn hơn 0");
    err.status = 400;
    throw err;
  }
  if (data.discount_type === "percent" && data.discount_value > 100) {
    const err = new Error("Phần trăm giảm không được vượt quá 100%");
    err.status = 400;
    throw err;
  }

  // Check duplicate
  const existing = await repo.findByCode(data.code);
  if (existing) {
    const err = new Error("Mã coupon đã tồn tại");
    err.status = 400;
    throw err;
  }

  return await repo.create(data);
};

/**
 * Cập nhật coupon (admin)
 */
exports.updateCoupon = async (id, data) => {
  const coupon = await repo.update(id, data);
  if (!coupon) {
    const err = new Error("Không tìm thấy coupon");
    err.status = 404;
    throw err;
  }
  return coupon;
};

/**
 * Xóa coupon (admin)
 */
exports.deleteCoupon = async (id) => {
  const coupon = await repo.remove(id);
  if (!coupon) {
    const err = new Error("Không tìm thấy coupon");
    err.status = 404;
    throw err;
  }
  return { message: "Đã xóa coupon", coupon };
};
