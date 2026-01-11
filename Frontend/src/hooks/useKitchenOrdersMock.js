import { useCallback, useEffect, useState } from "react";
import { ordersMockDb } from "../mock/ordersMockDb";

export function useKitchenOrdersMock() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    // Kitchen nhận đơn đã accepted + đang cooking (đang làm)
    const list = ordersMockDb
      .filter((o) => o.status === "accepted" || o.status === "cooking")
      // Ưu tiên cooking lên trước, rồi đến accepted; trong cùng nhóm thì đơn cũ trước
      .sort((a, b) => {
        const pr = (s) => (s === "cooking" ? 0 : 1);
        const d = pr(a.status) - pr(b.status);
        if (d !== 0) return d;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });

    setOrders(list);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Poll nhẹ để thấy waiter accept (mock in-memory)
  useEffect(() => {
    const timer = setInterval(load, 1500);
    return () => clearInterval(timer);
  }, [load]);

  const start = useCallback(
    (orderId) => {
      const idx = ordersMockDb.findIndex((o) => o.id === orderId);
      if (idx >= 0 && ordersMockDb[idx].status === "accepted") {
        ordersMockDb[idx] = {
          ...ordersMockDb[idx],
          status: "cooking",
          startedAt: Date.now(),
        };
      }
      load();
    },
    [load]
  );

  const complete = useCallback(
    (orderId) => {
      const idx = ordersMockDb.findIndex((o) => o.id === orderId);
      if (idx >= 0 && ordersMockDb[idx].status === "cooking") {
        ordersMockDb[idx] = {
          ...ordersMockDb[idx],
          status: "done",
          doneAt: Date.now(),
        };
      }
      load();
    },
    [load]
  );

  return { orders, isLoading, start, complete };
}
