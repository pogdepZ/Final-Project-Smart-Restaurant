import axiosClient from "../store/axiosClient";

export const adminMenuApi = {
  // GET /api/admin/menu/items
  // params: { q, categoryId, status, chef, sort }
  getMenuItems(params = {}) {
    return axiosClient.get("/admin/menu/items", { params });
  },

  // GET /api/admin/menu/categories
  getCategories() {
    return axiosClient.get("/admin/menu/categories");
  },

  // GET /api/admin/menu/items/:id
  getMenuItemDetail(id) {
    return axiosClient.get(`/admin/menu/items/${id}`);
  },

  createMenuItem: (payload) => axiosClient.post("/admin/menu/items", payload),

  toggleChefRecommended: (id, value) =>
    axiosClient.patch(`/admin/menu/items/${id}/chef`, { value }),

  createCategory: (payload) =>
    axiosClient.post("/admin/menu/categories", payload),

  updateMenuItem: (id, payload) =>
    axiosClient.patch(`/admin/menu/items/${id}`, payload).then((r) => r),

  deleteMenuItem: (id) =>
    axiosClient.patch(`/admin/menu/items/${id}/delete`).then((r) => r),

  uploadMenuImage(imageFile) {
    const form = new FormData();
    form.append("image", imageFile); // key này phải trùng với BE (multer.single("file") chẳng hạn)

    return axiosClient.post("/admin/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
