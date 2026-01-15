import { useEffect, useMemo, useState } from "react";
import { adminModifierApi } from "../services/adminModifierApi";

export function useAdminModifiers(params) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const key = useMemo(() => JSON.stringify(params || {}), [params]);

  const fetcher = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await adminModifierApi.getModifiers(params);
      setData(res);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Không thể tải modifiers"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetcher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isLoading, error, refetch: fetcher };
}
