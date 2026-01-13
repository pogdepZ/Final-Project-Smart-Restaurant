import { useCallback, useEffect, useState } from "react";
import { adminMenuApi } from "../services/adminMenuApi";
import { toast } from "react-toastify";

export function useAdminMenuCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminMenuApi.getCategories();
      setCategories(res.categories || []);
    } catch (e) {
      console.error("useAdminMenuCategories error:", e);
      const message =
        e?.message ||
        e?.response?.data?.message ||
        "Không tải được categories.";
      setError(message);
      toast.error(`${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}
