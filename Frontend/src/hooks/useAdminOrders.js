// src/hooks/useAdminOrders.js
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { adminOrdersApi } from "../services/adminOrdersApi";
import { useAdminSocketContext } from "../context/AdminSocketContext";

export function useAdminOrders(params) {
  const { subscribeToOrders } = useAdminSocketContext();
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
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe vào AdminSocketContext để nhận updates
  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      console.log("useAdminOrders: Refetching due to socket update");
      fetchOrders();
    });

    return unsubscribe;
  }, [subscribeToOrders, fetchOrders]);

  return { data, setData, isLoading, error, refetch: fetchOrders };
}
