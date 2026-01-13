import { useCallback, useEffect, useState } from "react";
import { adminOrdersApi } from "../services/adminOrdersApi";
import { toast } from "react-toastify";

export function useAdminOrders(filters = {}) {
  const [data, setData] = useState({ orders: [], pagination: null });
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const res = await adminOrdersApi.getOrders(filters);

      setData({
        orders: res.orders || [],
        pagination: res.pagination || null,
      });
    } catch (e) {
      console.error("getOrders error:", e);
      const message =
        e?.message ||
        e?.response?.data?.message ||
        "Không tải được danh sách order";
      setError(message);
      toast.error(`${message}`);
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
