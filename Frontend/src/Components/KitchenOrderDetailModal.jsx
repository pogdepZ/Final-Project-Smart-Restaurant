import React from "react";
import { Clock, Table2, CheckCircle2, PlayCircle, X } from "lucide-react";
import { formatTime, formatMoneyVND } from "../utils/orders";

export default function KitchenOrderDetailModal({
  order,
  onClose,
  onStart,
  onComplete,
}) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="absolute left-1/2 top-1/2 w-[95%] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 bg-white/5">
            <div>
              <div className="text-white font-black text-2xl flex items-center gap-2">
                {order.table_number || "Mang về"}
                <span className="text-sm font-normal text-gray-400 bg-white/10 px-2 py-0.5 rounded-md">
                  #{order.id.slice(0, 6)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="inline-flex items-center gap-2">
                  <Clock size={16} className="text-orange-500" />
                  <span>Thời gian đặt: {formatTime(order.created_at)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body (Scrollable) */}
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            <div className="rounded-2xl bg-neutral-900/60 border border-white/10 overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-white/5">
                <div className="font-bold text-white uppercase tracking-wider text-sm">
                  Chi tiết món ăn
                </div>
                <div className="text-orange-500 font-bold text-sm">
                  {(order.items || []).length} món
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {(order.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Quantity Badge */}
                      <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-lg font-black text-white border border-white/10">
                        {it.qty}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Tên món */}
                        <div className="text-lg font-bold text-gray-100 leading-tight">
                          {it.name}
                        </div>

                        {/* Modifiers (Topping/Size) */}
                        {it.modifiers && it.modifiers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {it.modifiers.map((mod, mIdx) => (
                              <div
                                key={mIdx}
                                className="text-sm text-gray-400 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                {mod.name}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Ghi chú món (Item Note) */}
                        {it.note && (
                          <div className="mt-2 text-sm text-orange-400 italic bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 inline-block">
                            Note: {it.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ghi chú chung cho cả đơn (Order Note) */}
            {order.note && (
              <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200">
                <div className="text-xs font-bold uppercase mb-1 opacity-70">
                  Ghi chú toàn đơn
                </div>
                <div className="text-base font-medium">{order.note}</div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-white/10 bg-black/40 flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold transition-all"
            >
              Đóng
            </button>

            {/* Logic nút bấm dựa trên trạng thái */}
            {order.status !== "preparing" ? (
              // Nếu chưa nấu (accepted) -> Nút Bắt đầu
              <button
                onClick={onStart}
                className="flex-1 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                <PlayCircle size={20} />
                Bắt đầu nấu
              </button>
            ) : (
              // Nếu đang nấu (preparing) -> Nút Hoàn thành
              <button
                onClick={onComplete}
                className="flex-1 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Hoàn thành đơn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
