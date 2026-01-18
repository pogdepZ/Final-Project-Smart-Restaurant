import { useCallback, useEffect, useState } from "react";
import { adminMenuApi } from "../services/adminMenuApi";
import { toast } from "react-toastify";

export function useAdminMenuCategories({ status = "ALL" } = {}) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // ✅ chỉ lấy category chưa bị xoá
      const res = await adminMenuApi.getListCategories({
        status: status !== "ALL" ? status : undefined,
        includeDeleted: false,
      });

      setCategories(res?.categories || res || []);
    } catch (e) {
      console.error("useAdminMenuCategories error:", e);
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Không tải được categories.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}
