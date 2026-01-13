import React from "react";
import { Clock, Table2, CheckCircle2 } from "lucide-react";
import { formatTime, formatMoneyVND } from "../utils/orders";

export default function KitchenOrderDetailModal({ order, onClose, onComplete }) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
            <div>
              <div className="text-white font-black text-xl">{order.id}</div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="inline-flex items-center gap-2">
                  <Table2 size={16} className="text-orange-500" />
                  <span className="font-semibold text-gray-200">{order.tableNumber || "—"}</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Clock size={16} className="text-orange-500" />
                  <span>{formatTime(order.created_at)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95"
            >
              Đóng
            </button>
          </div>

          <div className="p-5">
            <div className="rounded-2xl bg-neutral-900/60 border border-white/10 overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="font-bold text-white">Món cần làm</div>
                <div className="text-gray-400 text-sm">{(order.items || []).length} món</div>
              </div>

              <div className="border-t border-white/10">
                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-center justify-between gap-4 border-b border-white/5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">
                        {it.qty}× {it.name}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatMoneyVND(it.price)} / phần
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm font-bold">
                      x{it.qty}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.note ? (
              <div className="mt-4 p-4 rounded-2xl bg-black/30 border border-white/10 text-gray-300">
                <div className="text-gray-500 text-sm mb-1">Ghi chú</div>
                <div className="text-white">{order.note}</div>
              </div>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95"
              >
                Quay lại
              </button>

              {order.status === "accepted" ? (
                <button
                  onClick={onStart}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                >
                  Thực hiện
                </button>
              ) : (
                <button
                  onClick={onComplete}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  Hoàn thành
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
