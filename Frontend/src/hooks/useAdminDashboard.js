import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

export function useAdminDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        const res = await dashboardApi.getAdminDashboard();
        if (!mounted) return;

        setData(res);
        setError("");
      } catch (e) {
        console.log("DASHBOARD ERROR:", e);
        console.log("STATUS:", e?.response?.status);
        console.log("DATA:", e?.response?.data);
        console.log("HEADERS SENT:", e?.config?.headers);
        if (!mounted) return;

        const msg =
          e?.response?.data?.message || e?.message || "Không thể tải dashboard";
        setError(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading, error };
}
