// src/services/tableApi.js
import axiosClient from "../store/axiosClient";

export const tableApi = {
 
  getTables: (params) => axiosClient.get("/tables", { params }),

  getTableById: (id) => axiosClient.get(`/tables/${id}`),

  createTable: (data) => axiosClient.post("/tables", data),

  updateTable: (id, data) => axiosClient.put(`/tables/${id}`, data),

  deleteTable: (id) => axiosClient.delete(`/tables/${id}`),

  // nếu bạn có route PATCH /tables/:id/status
  toggleStatus: (id) => axiosClient.patch(`/tables/${id}/status`),
};
