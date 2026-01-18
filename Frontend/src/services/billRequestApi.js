import axiosClient from "../store/axiosClient";

export const billRequestApi = {
  // Khách gửi yêu cầu thanh toán
  requestBill: (data) => axiosClient.post("/bill-requests/request", data),

  // Kiểm tra trạng thái yêu cầu của bàn
  getStatus: (tableId) => axiosClient.get(`/bill-requests/status/${tableId}`),

  // Staff: Lấy danh sách pending
  getPending: () => axiosClient.get("/bill-requests/pending"),

  // Staff: Xác nhận đã nhận
  acknowledge: (id) => axiosClient.patch(`/bill-requests/${id}/acknowledge`),

  // Staff: Hủy yêu cầu
  cancel: (id) => axiosClient.delete(`/bill-requests/${id}`),
};

export default billRequestApi;
