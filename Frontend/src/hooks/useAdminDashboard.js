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
    const unsubscribe = subscribeToDashboard(() => {
      console.log("useAdminDashboard: Refetching due to socket update");
      fetchDashboard();
    });

    return unsubscribe;
  }, [subscribeToDashboard, fetchDashboard]);

  return { data, isLoading, errors, refetch: fetchDashboard };
}
