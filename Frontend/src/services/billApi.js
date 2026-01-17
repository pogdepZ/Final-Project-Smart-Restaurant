import axiosClient from "../store/axiosClient";

export const billApi = {
  async previewBill(tableId, billData) {
    return axiosClient.post(`/billing/preview/table/${tableId}`, {
      discount_type: billData.discount_type,
      discount_value: billData.discount_value,
    });
  },

  async checkoutBill(tableId, billData) {
    return axiosClient.post(`/billing/checkout/table/${tableId}`, {
      payment_method: billData.payment_method,
      discount_type: billData.discount_type,
      discount_value: Number(billData.discount_value),
    });
  },
};
