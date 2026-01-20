import React from "react";
import { X } from "lucide-react";
import { formatMoneyVND } from "../../../utils/orders";

const badge = (uiStatus) => {
  if (uiStatus === "Ready")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
  if (uiStatus === "Cooking")
    return "bg-orange-500/15 text-orange-300 border-orange-500/25";
  if (uiStatus === "Rejected")
    return "bg-red-500/15 text-red-300 border-red-500/25";
  return "bg-white/5 text-white/70 border-white/10"; // Queued
};

export default function OrderDetailModal({ open, onClose, order, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-white font-black">Chi tiết đơn</p>
              {order?.table_number ? (
                <p className="text-xs text-white/50">
                  Bàn: {order.table_number}
                </p>
              ) : null}
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {loading ? (
              <p className="text-white/50">Đang tải...</p>
            ) : !order ? (
              <p className="text-white/50">Không có dữ liệu.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-white/50">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-xs uppercase font-black text-orange-400">
                      {order.status} • {order.payment_status}
                    </p>
                  </div>
                  <p className="font-black">
                    {formatMoneyVND(Number(order.total_amount || 0))}
                  </p>
                </div>

                <div className="space-y-2">
                  {(order.items || []).map((it) => (
                    <div
                      key={it.id}
                      className="flex items-start justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold truncate">
                          {it.quantity}x {it.item_name}
                        </p>
                        {it.note ? (
                          <p className="text-xs text-white/50 mt-0.5">
                            Note: {it.note}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={[
                            "inline-flex items-center px-2 py-1 rounded-lg border text-[11px] font-black uppercase",
                            badge(it.uiStatus),
                          ].join(" ")}
                        >
                          {it.uiStatus}
                        </span>
                        <p className="text-xs text-white/60 mt-1">
                          {it.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.note ? (
                  <div className="mt-4 text-sm text-white/70">
                    <span className="text-white/50">Ghi chú đơn:</span>{" "}
                    {order.note}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
