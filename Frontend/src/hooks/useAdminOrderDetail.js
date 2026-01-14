import { useEffect, useState } from "react";
import { adminOrdersApi } from "../services/adminOrdersApi";
import { toast } from "react-toastify";

export function useAdminOrderDetail(orderId, open) {
  const [order, setOrder] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    if (!orderId || !open) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setOrder(null);

        const res = await adminOrdersApi.getOrderDetail(orderId);
        setOrder(res.order);
      } catch (e) {
        console.error("getOrderDetail error:", e);
        const message =
          e?.message ||
          e?.response?.data?.message ||
          "Không tải được chi tiết order";
        setError(message);
        toast.error(`${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [orderId, open]);

  return { order, isLoading, error };
}
