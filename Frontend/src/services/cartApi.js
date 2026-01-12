import axiosClient from "../store/axiosClient";
export const cartApi = {
  getActive: (tableCode) => axiosClient.get(`/cart/active?tableCode=${tableCode}`),
  addItem: (payload) => axiosClient.post(`/cart/items`, payload),
  updateQty: (cartItemId, quantity) => axiosClient.patch(`/cart/items/${cartItemId}`, { quantity }),
  removeItem: (cartItemId) => axiosClient.delete(`/cart/items/${cartItemId}`),
  clearCart: (cartId) => axiosClient.delete(`/cart/${cartId}/items`),
};