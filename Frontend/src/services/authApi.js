import axiosClient from "../store/axiosClient";

export const authApi = {
    checkEmail: (email) =>
        axiosClient.get(`/auth/check-email`, { params: { email } }),
    forgotPassword: (email) =>
        axiosClient.post("/auth/forgot-password", { email }),
    resetPassword: ({ token, newPassword }) =>
        axiosClient.post("/auth/reset-password", { token, newPassword }),

};