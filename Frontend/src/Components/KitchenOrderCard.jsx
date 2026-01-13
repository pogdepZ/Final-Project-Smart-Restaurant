import React from "react";
import { Clock, Table2, CheckCircle2, Eye, PlayCircle } from "lucide-react";
import { formatTime } from "../utils/orders";

export default function KitchenOrderCard({ order, onView, onStart, onComplete }) {
  if (!order) return null;

  // in order
  // console.log(">>>>>> order in KitchenOrderCard:", order);


  const items = order.items || [];
  console.log(">>>>>> order items:", items);


  const totalItems = items.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);

  // Helper format thời gian
  const formatTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper tính thời gian đã trôi qua (phút)
  const getMinutesElapsed = (isoString) => {
    if (!isoString) return 0;
    const diff = new Date() - new Date(isoString);
    return Math.floor(diff / 60000);
  };

  const elapsed = getMinutesElapsed(order.created_at);

  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/10 shadow-2xl overflow-hidden h-full flex flex-col">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white font-black text-lg">{order.id}</div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="inline-flex items-center gap-2">
                <Table2 size={16} className="text-orange-500" />
                <span className="font-semibold text-gray-200">{order.table_number || "Mang về"}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                <span>{formatTime(order.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold">
              {totalItems} món
            </div>

            {order.status === "cooking" ? (
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                Đang làm
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200 text-xs font-bold">
                Chờ làm
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {(items || []).slice(0, 4).map((it, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{it.name}</div>
              </div>
              <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm font-bold">
                x{it.qty}
              </div>
            </div>
          ))}
          {(items || []).length > 4 && (
            <div className="text-xs text-gray-500">+{items.length - 4} món khác</div>
          )}
        </div>

        {order.note ? (
          <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 text-sm text-gray-300">
            <span className="text-gray-500">Ghi chú: </span>
            {order.note}
          </div>
        ) : null}

        {/* Actions pinned bottom */}
        <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            Xem chi tiết
          </button>

          {order.status === "accepted" ? (
            <button
              onClick={onStart}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
            >
              <PlayCircle size={18} />
              Thực hiện
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              <CheckCircle2 size={18} />
              Hoàn thành
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
