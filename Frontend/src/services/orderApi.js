// src/services/orderApi.js
import axiosClient from "../store/axiosClient";

export const orderApi = {
  getMyOrders(params) {
    return axiosClient.get("/orders/my", { params });
  },
  getMyOrderDetail(orderId) {
    return axiosClient.get(`/orders/${orderId}`);
  },

  // Lấy đơn hàng của bàn hiện tại (dùng qrToken)
  getOrdersByTable(qrToken) {
    return axiosClient.get("/orders/by-table", {
      headers: {
        "qrToken": qrToken,
      },
    });
  },
  
  // Lấy chi tiết đơn hàng theo ID (public - cho khách)
  getOrderTracking(orderId, qrToken) {
    return axiosClient.get(`/orders/${orderId}/tracking`, {
      headers: {
        "qrToken": qrToken,
      },
    });
  },
};
