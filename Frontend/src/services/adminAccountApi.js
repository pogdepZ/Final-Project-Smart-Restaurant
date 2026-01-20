import axiosClient from "../store/axiosClient";

export const adminAccountApi = {
  // GET /admin/accounts?scope=STAFF&q=...&role=...&verified=...&sort=...&page=...&limit=...
  getAccounts(params) {
    return axiosClient.get("/admin/accounts", { params });
  },

  // POST /admin/accounts/staff
  // body: { name, email, password, role: 'waiter'|'kitchen'|'admin'|'superadmin'?, is_verified }
  createStaffAccount(body) {
    return axiosClient.post("/admin/accounts/staff", body);
  },

  setActived(id, isActived) {
    return axiosClient.patch(`/admin/accounts/${id}/actived`, {
      isActived,
    });
  },

  // DELETE /admin/accounts/:id
  deleteAccount(id) {
    return axiosClient.delete(`/admin/accounts/${id}`);
  },

  updateAccount: (id, payload) =>
    axiosClient.patch(`/admin/accounts/${id}`, payload),
};
