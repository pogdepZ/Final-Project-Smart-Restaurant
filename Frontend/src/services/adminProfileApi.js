// src/services/adminProfileApi.js
import axiosClient from "../store/axiosClient";

export const adminProfileApi = {
  // GET /api/admin/profile
  getMyProfile() {
    return axiosClient.get("/admin/profile");
  },

  // PATCH /api/admin/profile
  updateMyProfile(body) {
    return axiosClient.patch("/admin/profile", body);
  },

  // POST /api/admin/profile/avatar (Cloudinary upload)
  uploadAvatar(file) {
    const fd = new FormData();
    fd.append("avatar", file);
    return axiosClient.post("/admin/profile/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
