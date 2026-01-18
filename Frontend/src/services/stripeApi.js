import axiosClient from "../store/axiosClient";

export const stripeApi = {
  // Lấy Stripe config (publishable key)
  getConfig: () => axiosClient.get("/stripe/config"),

  // Tạo Payment Intent
  createPaymentIntent: (tableId, data) =>
    axiosClient.post(`/stripe/create-payment-intent/${tableId}`, data),

  // Xác nhận thanh toán
  confirmPayment: (paymentIntentId) =>
    axiosClient.post("/stripe/confirm-payment", { paymentIntentId }),

  // Lấy trạng thái payment
  getPaymentStatus: (paymentIntentId) =>
    axiosClient.get(`/stripe/payment-status/${paymentIntentId}`),
};

export default stripeApi;
