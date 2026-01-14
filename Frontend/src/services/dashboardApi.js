import axiosClient from "../store/axiosClient";

export const dashboardApi = {
  getAdminDashboard: () => axiosClient.get("/admin/dashboard"),

  getOrdersDaily({ month }) {
    return axiosClient.get("/admin/dashboard/orders-daily", {
      params: { month },
    });
  },

  getPeakHours({ from, to }) {
    return axiosClient.get("/admin/dashboard/peak-hours", {
      params: { from, to },
    });
  },

  getPopularItems({ from, to, limit = 8 }) {
    return axiosClient.get("/admin/dashboard/popular-items", {
      params: { from, to, limit },
    });
  },

  getRevenue(params) {
    return axiosClient.get("/admin/dashboard/revenue", { params });
  },
};
