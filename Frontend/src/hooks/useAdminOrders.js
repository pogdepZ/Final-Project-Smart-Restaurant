// src/hooks/useAdminOrders.js
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { adminOrdersApi } from "../services/adminOrdersApi";
import { useAdminSocketContext } from "../context/AdminSocketContext";

// Helper: Chuyển đổi order từ snake_case sang camelCase để khớp với format UI
function normalizeOrder(order) {
  if (!order) return order;

  // Parse totalAmount - có thể là string từ PostgreSQL NUMERIC
  const rawTotal = order.totalAmount ?? order.total_amount;
  const totalAmount =
    rawTotal !== null && rawTotal !== undefined ? Number(rawTotal) : null;

  return {
    ...order,
    // Map các field từ snake_case sang camelCase
    tableName:
      order.tableName || order.table_name || order.table_number || null,
    createdAt: order.createdAt || order.created_at || null,
    updatedAt: order.updatedAt || order.updated_at || null,
    totalAmount: totalAmount,
    totalItems:
      order.totalItems ?? order.total_items ?? (order.items?.length || 0),
    paymentMethod: order.paymentMethod || order.payment_method || null,
    tableId: order.tableId || order.table_id || null,
  };
}

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

      console.log("Fetched admin orders:", res);

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
        setData((prev) => {
          if (!prev || !prev.orders) return prev;

          const rawOrder = update.data.order || update.data;
          const newOrder = normalizeOrder(rawOrder);
          console.log("🆕 Nhận order từ socket:", newOrder);

          const existingIndex = prev.orders.findIndex(
            (o) => o.id === newOrder.id,
          );

          if (existingIndex !== -1) {
            // Order đã tồn tại → UPDATE (customer thêm món mới vào order cũ)
            console.log("🔄 Cập nhật order đã tồn tại:", newOrder.id);
            const newOrders = [...prev.orders];
            newOrders[existingIndex] = {
              ...newOrders[existingIndex],
              ...newOrder,
            };

            return {
              ...prev,
              orders: newOrders,
            };
          } else {
            // Order hoàn toàn mới → THÊM vào đầu danh sách
            console.log("➕ Thêm order mới:", newOrder.id);
            return {
              ...prev,
              orders: [newOrder, ...prev.orders],
              pagination: {
                ...prev.pagination,
                total: prev.pagination.total + 1,
              },
            };
          }
        });
      } else if (update.type === "order_update") {
        // Cập nhật order hiện có trong danh sách (waiter/kitchen update status)
        setData((prev) => {
          if (!prev || !prev.orders) return prev;

          const rawOrder = update.data.order || update.data;
          const updatedOrder = normalizeOrder(rawOrder);
          console.log("🔄 Cập nhật trạng thái order:", updatedOrder);

          const orderIndex = prev.orders.findIndex(
            (o) => o.id === updatedOrder.id,
          );

          if (orderIndex === -1) {
            console.log(
              "⚠️ Order không tìm thấy trong danh sách:",
              updatedOrder.id,
            );
            return prev;
          }

          const newOrders = [...prev.orders];
          newOrders[orderIndex] = { ...newOrders[orderIndex], ...updatedOrder };

          return {
            ...prev,
            orders: newOrders,
          };
        });
      } else if (update.type === "payment_completed") {
        // Thanh toán thành công → Cập nhật tất cả orders của bàn thành "completed"
        const { table_id, table_number } = update.data;
        console.log("💰 Thanh toán thành công bàn:", table_number || table_id);

        setData((prev) => {
          if (!prev || !prev.orders) return prev;

          const newOrders = prev.orders.map((order) => {
            // Tìm orders của bàn vừa thanh toán
            if (
              order.table_id === table_id ||
              order.table_id === String(table_id)
            ) {
              // Chỉ update những order chưa completed/rejected
              if (order.status !== "completed" && order.status !== "rejected") {
                console.log("✅ Đánh dấu order đã thanh toán:", order.id);
                return { ...order, status: "completed" };
              }
            }
            return order;
          });

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
