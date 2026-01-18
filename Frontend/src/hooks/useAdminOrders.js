// src/hooks/useAdminOrders.js
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { adminOrdersApi } from "../services/adminOrdersApi"; // bạn map đúng service

export function useAdminOrders(params) {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminOrdersApi.getOrders(params);
      setData(res);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Không tải được orders";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // quick way, hoặc dùng deps tường minh

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { data, isLoading, error, refetch: fetchOrders };
}
