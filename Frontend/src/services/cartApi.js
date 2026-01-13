import axiosClient from "../store/axiosClient";

export const cartApi = {
  // DB-cart APIs (nếu bạn vẫn muốn dùng ở nơi khác)
  getActive: (tableCode) => axiosClient.get(`/cart/active?tableCode=${tableCode}`),
  addItem: (payload) => axiosClient.post(`/cart/items`, payload),
  updateQty: (cartItemId, quantity) =>
    axiosClient.patch(`/cart/items/${cartItemId}`, { quantity }),
  removeItem: (cartItemId) => axiosClient.delete(`/cart/items/${cartItemId}`),
  clearCart: (cartId) => axiosClient.delete(`/cart/${cartId}/items`),

  // ✅ NEW: sync local cart -> DB (chỉ gọi khi bấm Đặt món)
  sync: (payload, qrToken) =>
    axiosClient.post(`/cart/sync`, payload, {
      headers: { "x-qr-token": qrToken },
    }),
};
