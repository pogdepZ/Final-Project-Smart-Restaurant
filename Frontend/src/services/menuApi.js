// src/services/menuApi.js
// Nếu bạn đã có axiosClient sẵn thì cứ import nó.
// Nếu chưa, bạn có thể thay axiosClient bằng axios.create({ baseURL: ... })
import axiosClient from '../store/axiosClient';

function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}
export const menuApi = {
  // GET /api/menu/categories
  async getMenuCategories() {
    // axiosClient của bạn đang unwrap response.data rồi thì return res luôn
    return axiosClient.get("/menu/categories");
  },

  // GET /api/menu/items?search=&category_id=&sort=&page=&limit=&chef=
  async getMenuItems(params = {}, config = {}) {
    const qp = cleanParams(params);
    return axiosClient.get("/menu/items", { ...config, params: qp });
  },

  // GET /api/menu/items/:id
  async getMenuItemById(id) {
    return axiosClient.get(`/menu/items/${id}`);
  },

  // GET /api/menu/items/:id/related
  async getRelatedMenuItems(id) {
    const response =  axiosClient.get(`/menu/items/${id}/related`);
    console.log('Related items response:', response);
    return response;
  },

  // GET /api/menu/items/:id/reviews?page=&limit=
  async getItemReviews(id, params = {}) {
    const qp = cleanParams(params);
    return axiosClient.get(`/menu/items/${id}/reviews`, { params: qp });
  },

  // POST /api/menu/reviews  (cần login)
  async createReview(payload) {
    console.log(payload);
    return axiosClient.post("/menu/reviews", payload);
  },

  async getTopChefBestSeller(limit = 5) {
    return axiosClient.get(`/menu/top-chef?limit=${limit}`)
  },

};
