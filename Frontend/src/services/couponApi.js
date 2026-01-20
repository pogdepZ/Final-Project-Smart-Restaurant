// src/services/couponApi.js
import axiosClient from "../store/axiosClient";

export const couponApi = {
  /**
   * Validate coupon code
   * @param {string} code - Coupon code
   * @param {number} orderAmount - Order subtotal amount
   */
  validate: async (code, orderAmount) => {
    const response = await axiosClient.post("/coupons/validate", {
      code,
      order_amount: orderAmount,
    });
    return response;
  },
};
