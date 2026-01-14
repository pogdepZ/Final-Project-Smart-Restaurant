// src/services/orderApi.js
import axiosClient from "../store/axiosClient";

export const orderApi = {
    getMyOrders(params) {
        return axiosClient.get("/orders/my", { params });
    },
    getMyOrderDetail(orderId) {
        return axiosClient.get(`/orders/${orderId}`);
    },
};
