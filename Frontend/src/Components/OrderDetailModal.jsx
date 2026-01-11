import React from "react";
import { CheckCircle2, XCircle, Clock, Table2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { calcTotal, formatMoneyVND, formatTime } from "../utils/orders";

export default function OrderDetailModal({ order, onClose, onAccept, onReject }) {
  const total = calcTotal(order);

  return (
    <div className="fixed inset-0 z-60">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="text-white font-black text-xl">{order.id}</div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="inline-flex items-center gap-2">
                  <Table2 size={16} className="text-orange-500" />
                  <span className="font-semibold text-gray-200">{order.tableNumber || "—"}</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Clock size={16} className="text-orange-500" />
                  <span>{formatTime(order.createdAt)}</span>
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
                <div className="font-bold text-white">Danh sách món</div>
                <div className="text-gray-400 text-sm">{order.items.length} món</div>
              </div>

              <div className="border-t border-white/10">
                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-center justify-between gap-4 border-b border-white/5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{it.name}</div>
                      <div className="text-gray-400 text-sm">
                        {it.qty} × {formatMoneyVND(it.price)}
                      </div>
                    </div>
                    <div className="text-gray-200 font-bold">
                      {formatMoneyVND(it.qty * it.price)}
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

            <div className="mt-4 flex items-center justify-between p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <div className="text-gray-200 font-semibold">Tổng cộng</div>
              <div className="text-white font-black text-2xl">{formatMoneyVND(total)}</div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95"
              >
                Quay lại
              </button>

              {order.status === "pending" ? (
                <>
                  <button
                    onClick={onReject}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-200 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Từ chối
                  </button>
                  <button
                    onClick={onAccept}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all active:scale-95 inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                  >
                    <CheckCircle2 size={18} />
                    Chấp nhận
                  </button>
                </>
              ) : (
                <div className="sm:ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 border border-white/5 text-gray-300">
                  <CheckCircle2 size={18} className="text-orange-500" />
                  <span className="text-sm">Đơn đã xử lý</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
