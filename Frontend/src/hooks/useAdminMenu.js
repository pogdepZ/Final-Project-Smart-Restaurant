import { useCallback, useEffect, useMemo, useState } from "react";
import { adminMenuApi } from "../services/adminMenuApi";

export function useAdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [catRes, itemRes] = await Promise.all([
        adminMenuApi.getCategories(),
        adminMenuApi.getMenuItems(),
      ]);

      setCategories(catRes?.categories || []);
      setItems(itemRes?.items || []);
    } catch (e) {
      console.error("useAdminMenuManagement error:", e);
      setError(e?.message || "Không tải được menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data: { items, categories },
    isLoading,
    error,
    refetch: fetchAll,
  };
}
