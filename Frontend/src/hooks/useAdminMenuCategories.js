import { useCallback, useEffect, useState } from "react";
import { adminMenuApi } from "../services/adminMenuApi";

export function useAdminMenuCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminMenuApi.getCategories();
      setCategories(res.categories || []);
    } catch (e) {
      console.error("useAdminMenuCategories error:", e);
      setError(e?.message || "Không tải được categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}
