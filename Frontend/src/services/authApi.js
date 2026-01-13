import axiosClient from "../store/axiosClient";

export const authApi = {
  checkEmail: (email) =>
    axiosClient.get(`/auth/check-email`, { params: { email } }),
};