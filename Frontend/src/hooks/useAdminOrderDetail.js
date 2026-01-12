import { useEffect, useState } from "react";
import { adminOrdersApi } from "../services/adminOrdersApi";

export function useAdminOrderDetail(orderId, open) {
  const [order, setOrder] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId || !open) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        setOrder(null);

        const res = await adminOrdersApi.getOrderDetail(orderId);
        setOrder(res.order);
      } catch (e) {
        console.error("getOrderDetail error:", e);
        setError(e?.message || "Không tải được chi tiết order");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [orderId, open]);

  return { order, isLoading, error };
}
