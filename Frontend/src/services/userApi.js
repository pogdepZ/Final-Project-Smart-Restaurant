// src/services/userApi.js
import axiosClient from "../store/axiosClient";

export const userApi = {
  // lấy profile hiện tại (nếu cần)
  getMe: () => axiosClient.get("/users/me"),

  // update text fields
  updateMe: (payload) => axiosClient.put("/users/me", payload),

  // upload avatar
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    return axiosClient.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // đổi mật khẩu
  changePassword: (payload) => axiosClient.post("/users/me/change-password", payload),
};
