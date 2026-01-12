import { useCallback, useEffect, useState } from "react";
import { adminOrdersApi } from "../services/adminOrdersApi";

export function useAdminOrders(filters = {}) {
  const [data, setData] = useState({ orders: [], pagination: null });
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await adminOrdersApi.getOrders(filters);

      setData({
        orders: res.orders || [],
        pagination: res.pagination || null,
      });
    } catch (e) {
      console.error("getOrders error:", e);
      setError(e?.message || "Không tải được danh sách order");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}
