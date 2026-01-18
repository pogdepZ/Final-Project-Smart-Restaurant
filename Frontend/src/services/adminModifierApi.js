import axiosClient from "../store/axiosClient";

export const adminModifierApi = {
  // ===== GROUPS =====
  getGroups(params) {
    // GET /api/admin/modifier-groups?q=&status=&selection_type=&sort=&page=&limit=
    return axiosClient.get("/admin/modifiers/modifier-groups", { params });
  },

  getGroupDetail(groupId) {
    // GET /api/admin/modifier-groups/:id  -> { group, options }
    return axiosClient.get(`/admin/modifiers/modifier-groups/${groupId}`);
  },

  createGroup(body) {
    // POST /api/admin/modifier-groups
    // body: { name, selection_type, is_required, min_selections, max_selections, display_order, status }
    return axiosClient.post("/admin/modifiers/modifier-groups", body);
  },

  updateGroup(groupId, body) {
    // PATCH /api/admin/modifier-groups/:id
    return axiosClient.patch(
      `/admin/modifiers/modifier-groups/${groupId}`,
      body
    );
  },

  deleteGroup(groupId) {
    // DELETE /api/admin/modifier-groups/:id
    return axiosClient.delete(`/admin/modifiers/modifier-groups/${groupId}`);
  },

  // Toggle status nhanh (active <-> inactive)
  toggleGroupStatus(groupId, nextActive) {
    return axiosClient.patch(`/admin/modifiers/modifier-groups/${groupId}`, {
      status: nextActive ? "active" : "inactive",
    });
  },

  // ===== OPTIONS =====
  createOption(body) {
    // POST /api/admin/modifier-options
    // body: { group_id, name, price_adjustment, status }
    return axiosClient.post("/admin/modifiers/modifier-options", body);
  },

  updateOption(optionId, body) {
    // PATCH /api/admin/modifier-options/:id
    // body: { name?, price_adjustment?, status? }
    return axiosClient.patch(
      `/admin/modifiers/modifier-options/${optionId}`,
      body
    );
  },

  deleteOption(optionId) {
    // DELETE /api/admin/modifier-options/:id
    return axiosClient.delete(`/admin/modifiers/modifier-options/${optionId}`);
  },

  toggleOptionStatus(optionId, nextActive) {
    return axiosClient.patch(`/admin/modifiers/modifier-options/${optionId}`, {
      status: nextActive ? "active" : "inactive",
    });
  },
};
