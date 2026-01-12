import { useCallback, useEffect, useMemo, useState } from "react";
import { adminMenuApi } from "../services/adminMenuApi";
import { toast } from "react-toastify";

export function useAdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setCategories("");
      const [catRes, itemRes] = await Promise.all([
        adminMenuApi.getCategories(),
        adminMenuApi.getMenuItems(),
      ]);

      setCategories(catRes?.categories || []);
      setItems(itemRes?.items || []);
    } catch (e) {
      console.error("useAdminMenuManagement error:", e);
      const message =
        e?.message || e?.response?.data?.message || "Không tải được menu.";
      setErrors(message);
      toast.error(`${message}`);
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
    errors,
    refetch: fetchAll,
  };
}
