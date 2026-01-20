import axiosClient from "../store/axiosClient";

export const stripeApi = {
  // Lấy Stripe config (publishable key)
  getConfig: () => axiosClient.get("/stripe/config"),

  // Tạo Payment Intent
  createPaymentIntent: (tableId, data) =>
    axiosClient.post(`/stripe/create-payment-intent/${tableId}`, data),

  // Tạo Payment Link (QR Code)
  createPaymentLink: (tableId, data) =>
    axiosClient.post(`/stripe/create-payment-link/${tableId}`, data),

  // Xác nhận thanh toán
  confirmPayment: (paymentIntentId) =>
    axiosClient.post("/stripe/confirm-payment", { paymentIntentId }),

  // Lấy trạng thái payment
  getPaymentStatus: (paymentIntentId) =>
    axiosClient.get(`/stripe/payment-status/${paymentIntentId}`),

  // Kiểm tra trạng thái Checkout Session
  checkSessionStatus: (sessionId) =>
    axiosClient.get(`/stripe/session-status/${sessionId}`),
};

export default stripeApi;
