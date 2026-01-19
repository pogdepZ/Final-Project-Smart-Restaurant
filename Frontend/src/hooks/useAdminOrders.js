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
    const unsubscribe = subscribeToOrders((update) => {
      console.log("useAdminOrders: Received socket update:", update);

      // Cập nhật state trực tiếp thay vì fetch lại
      if (!data) return;

      if (update.type === "new_order") {
        // Thêm order mới vào đầu danh sách
        setData((prev) => {
          if (!prev || !prev.orders) return prev;

          const newOrder = update.data;
          const exists = prev.orders.some((o) => o.id === newOrder.id);

          if (exists) return prev;

          return {
            ...prev,
            orders: [newOrder, ...prev.orders],
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total + 1,
            },
          };
        });
      } else if (update.type === "order_update") {
        // Cập nhật order hiện có trong danh sách
        setData((prev) => {
          if (!prev || !prev.orders) return prev;

          const updatedOrder = update.data;
          const orderIndex = prev.orders.findIndex(
            (o) => o.id === updatedOrder.id,
          );

          if (orderIndex === -1) return prev;

          const newOrders = [...prev.orders];
          newOrders[orderIndex] = { ...newOrders[orderIndex], ...updatedOrder };

          return {
            ...prev,
            orders: newOrders,
          };
        });
      }
    });

    return unsubscribe;
  }, [subscribeToOrders, data]);

  return { data, setData, isLoading, error, refetch: fetchOrders };
}
