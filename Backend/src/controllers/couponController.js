// src/controllers/couponController.js
const couponService = require("../services/couponService");

/**
 * Validate coupon code
 * POST /api/coupons/validate
 * Body: { code, order_amount }
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, order_amount } = req.body;
    const result = await couponService.validateCoupon(
      code,
      Number(order_amount) || 0,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      valid: false,
      message: err.message || "Lỗi server",
    });
  }
};

/**
 * Get all coupons (admin)
 * GET /api/admin/coupons
 */
exports.getAllCoupons = async (req, res) => {
  try {
    const result = await couponService.getAllCoupons();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * Create coupon (admin)
 * POST /api/admin/coupons
 */
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await couponService.createCoupon(req.body);
    res.status(201).json({ message: "Tạo coupon thành công", coupon });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * Update coupon (admin)
 * PUT /api/admin/coupons/:id
 */
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    res.json({ message: "Cập nhật thành công", coupon });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

/**
 * Delete coupon (admin)
 * DELETE /api/admin/coupons/:id
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const result = await couponService.deleteCoupon(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
