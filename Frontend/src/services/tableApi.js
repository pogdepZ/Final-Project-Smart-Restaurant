// src/services/tableApi.js
import axiosClient from "../store/axiosClient";

// Kiểm tra bàn và tạo session mới khi quét QR
export const checkAndCreateSession = async (tableCode, userId = null) => {
  const response = await axiosClient.post(
    `/tables/${tableCode}/create-session`,
    {
      userId,
    },
  );
  return response.data;
};

// // Xác thực mã đặt bàn và kích hoạt session
// export const verifyBookingAndActivateSession = async (
//   tableCode,
//   bookingCode,
//   userId = null
// ) => {
//   const response = await axiosClient.post(`/tables/${tableCode}/verify-booking`, {
//     bookingCode,
//     userId,
//   });
//   return response.data;
// };

// Kết thúc session bàn (khi thanh toán xong)
export const endTableSession = async (tableCode, sessionId) => {
  const response = await axiosClient.post(`/tables/${tableCode}/end-session`, {
    sessionId,
  });
  return response.data;
};

export const validateSession = async (tableCode, sessionToken) => {
  const response = await axiosClient.get(`/tables/validate-session`, {
    params: { tableCode, sessionToken },
  });
  return response;
};

export const findSessionActive = async (userId) => {
  const response = await axiosClient.get(`/tables/find-session-active`, {
    params: { userId },
  });
  return response.data;
};

export const tableApi = {
  getTables: (params) => axiosClient.get("/tables", { params }),

  getTableById: (id) => axiosClient.get(`/tables/${id}`),

  createTable: (data) => axiosClient.post("/tables", data),

  updateTable: (id, data) => axiosClient.put(`/tables/${id}`, data),

  deleteTable: (id) => axiosClient.delete(`/tables/${id}`),

  // nếu bạn có route PATCH /tables/:id/status
  toggleStatus: (id) => axiosClient.patch(`/tables/${id}/status`),

  checkAndCreateSession,
  // verifyBookingAndActivateSession,
  endTableSession,
  validateSession,
  findSessionActive,

  // ===== Waiters =====
  async getWaiters() {
    const res = await axiosClient.get("/admin/tables/waiters");
    return res?.items ? res.items : Array.isArray(res) ? res : [];
  },

  // ===== Assignments =====
  async getTableAssignmentsByWaiter(waiterId) {
    if (!waiterId) throw new Error("Missing waiterId");
    const res = await axiosClient.get(
      `/admin/tables/table-assignments/${waiterId}`,
    );
    return {
      tableIds: (res?.tableIds || []).map(String),
      waiter: res?.waiter || null,
    };
  },

  async saveTableAssignmentsByWaiter(waiterId, tableIds = []) {
    if (!waiterId) throw new Error("Missing waiterId");
    const res = await axiosClient.put(
      `/admin/tables/table-assignments/${waiterId}`,
      {
        tableIds,
      },
    );
    return {
      message: res?.message,
      tableIds: (res?.tableIds || tableIds).map(String),
    };
  },
};

export default tableApi;
