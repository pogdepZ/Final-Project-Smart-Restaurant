import { useCallback, useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { toast } from "react-toastify";
import { useAdminSocketContext } from "../context/AdminSocketContext";

export function useAdminDashboard() {
  const { subscribeToDashboard } = useAdminSocketContext();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await dashboardApi.getAdminDashboard();
      setData(res);
    } catch (e) {
      console.log("DASHBOARD ERROR:", e);
      const msg =
        e?.response?.data?.message || e?.message || "Không thể tải dashboard";
      setErrors(msg);
      toast.error(`${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Subscribe vào AdminSocketContext để nhận updates
  useEffect(() => {
    const unsubscribe = subscribeToDashboard((update) => {
      console.log("useAdminDashboard: Received socket update:", update);

      // Cập nhật state một cách mượt mà thay vì fetch lại
      if (!data) return;

      setData((prev) => {
        if (!prev) return prev;

        // Tạo bản sao để cập nhật
        const updated = { ...prev };

        // Cập nhật dựa trên loại event
        if (update.type === "new_order" && updated.stats) {
          // Có thể tăng counter nếu cần
          // updated.stats.totalOrders = (updated.stats.totalOrders || 0) + 1;
        }

        if (update.type === "table_session_update" && updated.stats) {
          // Cập nhật số bàn đang hoạt động nếu cần
          // updated.stats.activeTables = update.data.activeTables;
        }

        // Với dashboard, chúng ta chỉ cần refresh nhẹ thay vì fetch lại
        // Trả về prev để không gây re-render nặng
        return prev;
      });
    });

    return unsubscribe;
  }, [subscribeToDashboard, data]);

  return { data, isLoading, errors, refetch: fetchDashboard };
}
