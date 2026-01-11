import { useCallback, useEffect, useRef, useState } from "react";
import { ordersMockDb } from "../mock/ordersMockDb";

export function useOrdersMock() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // để hook thông báo biết “đơn nào mới”
  const knownIdsRef = useRef(new Set());

  const normalize = useCallback((list) => {
    const sorted = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return sorted;
  }, []);

  const syncKnownIds = useCallback((list) => {
    knownIdsRef.current = new Set((list || []).map((o) => o.id));
  }, []);

  useEffect(() => {
    // load lần đầu
    const t = setTimeout(() => {
      const list = normalize(ordersMockDb);
      setOrders(list);
      syncKnownIds(list);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, [normalize, syncKnownIds]);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError("");
      // giả lập network
      await new Promise((r) => setTimeout(r, 250));

      const list = normalize(ordersMockDb);
      setOrders(list);
      syncKnownIds(list);
    } catch (e) {
      setError(e?.message || "Refresh thất bại.");
    } finally {
      setIsRefreshing(false);
    }
  }, [normalize, syncKnownIds]);

  const accept = useCallback(async (orderId) => {
    // optimistic + cập nhật mock db
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "accepted" } : o)));
    const idx = ordersMockDb.findIndex((o) => o.id === orderId);
    if (idx >= 0) ordersMockDb[idx] = { ...ordersMockDb[idx], status: "accepted" };
    return true;
  }, []);

  const reject = useCallback(async (orderId) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "rejected" } : o)));
    const idx = ordersMockDb.findIndex((o) => o.id === orderId);
    if (idx >= 0) ordersMockDb[idx] = { ...ordersMockDb[idx], status: "rejected" };
    return true;
  }, []);

  return {
    orders,
    setOrders,
    isLoading,
    isRefreshing,
    error,
    refresh,
    accept,
    reject,
    knownIdsRef,
  };
}
