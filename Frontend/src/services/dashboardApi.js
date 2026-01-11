import axiosClient from "../store/axiosClient";

export const dashboardApi = {
  getAdminDashboard: () => axiosClient.get("/admin/dashboard"),
};
