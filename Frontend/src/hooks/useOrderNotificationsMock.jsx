import { useEffect } from "react";
import { toast } from "react-toastify";
import { Bell } from "lucide-react";
import { createRandomOrder, ordersMockDb } from "../mock/ordersMockDb";

export function useOrderNotificationsMock({
  enabled = true,
  intervalMs = 5000,
  knownIdsRef,
  onNewOrders, // (newOrders) => void
  onJumpToPending, // () => void
}) {
  useEffect(() => {
    if (!enabled) return;
    if (!knownIdsRef?.current) return;

    const timer = setInterval(() => {
      // 1) thỉnh thoảng tạo đơn mới
      const shouldCreate = Math.random() < 0.22; // ~22% mỗi lần poll
      if (shouldCreate) {
        const newOrder = createRandomOrder();
        // đảm bảo không trùng id
        if (!ordersMockDb.some((o) => o.id === newOrder.id)) {
          ordersMockDb.unshift(newOrder);
        }
      }

      // 2) tìm những đơn mới chưa biết
      const trulyNew = ordersMockDb.filter((o) => !knownIdsRef.current.has(o.id));
      if (!trulyNew.length) return;

      // 3) cập nhật known ids ngay
      for (const o of trulyNew) knownIdsRef.current.add(o.id);

      // 4) notify UI (để setOrders)
      onNewOrders?.(trulyNew);

      // 5) toast
      const count = trulyNew.length;
      toast(
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-orange-500">
            <Bell size={18} />
          </div>
          <div>
            <div className="font-bold text-white">Có {count} đơn mới!</div>
            <div className="text-gray-300 text-sm">Nhấn để xem đơn chờ.</div>
          </div>
        </div>,
        { onClick: () => onJumpToPending?.() }
      );
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs, knownIdsRef, onNewOrders, onJumpToPending]);
}