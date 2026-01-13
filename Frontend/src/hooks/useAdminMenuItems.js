import { useCallback, useEffect, useState } from "react";
import { adminMenuApi } from "../services/adminMenuApi";
import { toast } from "react-toastify";

export function useAdminMenuItems(params) {
  const [data, setData] = useState({ items: [], pagination: null });
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState();
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminMenuApi.getMenuItems(params);
      setData({
        items: res.items || [],
        pagination: res.pagination || null,
      });
    } catch (e) {
      console.error("useAdminMenuItems error:", e);
      const message =
        e?.message ||
        e?.response?.data?.message ||
        "Không tải được danh sách món.!";
      setError(message);
      toast.error(`${message}`);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // eslint-disable-line

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { data, isLoading, refetch: fetchItems };
}
