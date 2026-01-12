import { useEffect, useState } from "react";
import { adminDashboardMock } from "../mock/adminDashboardMock";

export function useAdminDashboardMock() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setData(adminDashboardMock);
        setError("");
      } catch (e) {
        setError(e?.message || "Không tải được dashboard.");
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, []);

  return { data, isLoading, error };
}
