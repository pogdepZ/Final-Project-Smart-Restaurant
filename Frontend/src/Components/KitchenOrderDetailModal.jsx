import React, { useMemo } from "react";
import {
  Clock,
  Table2,
  CheckCircle2,
  PlayCircle,
  X,
  AlertTriangle,
  Check,
  XCircle,
} from "lucide-react";
import { formatTime, formatMoneyVND } from "../utils/orders";
import OrderTimer from "./OrderTimer";

export default function KitchenOrderDetailModal({
  order,
  onClose,
  onStart,
  onComplete,
  onUpdateItemStatus,
}) {
  if (!order) return null;

  const items = order.items || [];

  // Tính prep time và trạng thái urgent
  const { maxPrepTime, elapsed, isUrgent, overdueItems } = useMemo(() => {
    const max = Math.max(...items.map((it) => it.prep_time_minutes || 15), 15);
    const elapsedMins =
      (Date.now() - new Date(order.created_at).getTime()) / 60000;
    const overdue = items.filter(
      (it) => elapsedMins >= (it.prep_time_minutes || 15),
    );

    return {
      maxPrepTime: max,
      elapsed: elapsedMins,
      isUrgent: elapsedMins >= max,
      overdueItems: overdue,
    };
  }, [order, items]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "ready":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
            <CheckCircle2 size={12} /> Xong
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
            <X size={12} /> Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
            <Clock size={12} /> Đang làm
          </span>
        );
    }
  };

  // Kiểm tra tất cả items đã ready hoặc rejected chưa
  const allItemsDone = order.items?.every(
    (item) => item.status === "ready" || item.status === "rejected",
  );

  return (
    <div className="fixed inset-0 z-60">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="absolute left-1/2 top-1/2 w-[95%] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div
          className={`rounded-2xl bg-neutral-950 border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isUrgent
              ? "border-red-500/50 ring-2 ring-red-500/20"
              : "border-white/10"
          }`}
        >
          {/* Urgent Banner */}
          {isUrgent && (
            <div className="px-5 py-3 bg-red-500/20 border-b border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className="text-red-400 animate-bounce"
                />
                <span className="text-red-400 text-sm font-bold uppercase tracking-wide">
                  Đơn trễ - {overdueItems.length} món vượt thời gian!
                </span>
              </div>
              <OrderTimer
                createdAt={order.created_at}
                estimatedMinutes={maxPrepTime}
                size="small"
                showLabel={false}
              />
            </div>
          )}

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

                {/* Timer */}
                {!isUrgent && (
                  <OrderTimer
                    createdAt={order.created_at}
                    estimatedMinutes={maxPrepTime}
                    size="default"
                  />
                )}
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
                  {items.length} món
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {items.map((it, idx) => {
                  const itemPrepTime = it.prep_time_minutes || 15;
                  const itemOverdue = elapsed >= itemPrepTime;
                  const overtimeMinutes = Math.floor(elapsed - itemPrepTime);
                  const isItemReady = it.status === "ready";
                  const isItemRejected = it.status === "rejected";
                  const isItemPending = !isItemReady && !isItemRejected;

                  return (
                    <div
                      key={it.id || idx}
                      className={`p-4 transition-colors ${
                        isItemReady
                          ? "bg-green-500/10"
                          : isItemRejected
                          ? "bg-red-500/10 opacity-50"
                          : itemOverdue
                          ? "bg-red-500/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Quantity Badge */}
                        <div
                          className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black border ${
                            isItemReady
                              ? "bg-green-500/20 border-green-500/30 text-green-300"
                              : isItemRejected
                              ? "bg-red-500/20 border-red-500/30 text-red-300"
                              : itemOverdue
                              ? "bg-red-500/20 border-red-500/30 text-red-300"
                              : "bg-white/10 border-white/10 text-white"
                          }`}
                        >
                          {it.qty}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Tên món + Status + Overdue indicator */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div
                              className={`text-lg font-bold leading-tight ${
                                isItemReady
                                  ? "text-green-300 line-through"
                                  : isItemRejected
                                  ? "text-red-300 line-through"
                                  : itemOverdue
                                  ? "text-red-300"
                                  : "text-gray-100"
                              }`}
                            >
                              {it.item_name || it.name}
                            </div>

                            {/* Status badge */}
                            {isItemReady && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold">
                                <Check size={10} /> Xong
                              </span>
                            )}
                            {isItemRejected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
                                <XCircle size={10} /> Từ chối
                              </span>
                            )}
                            {isItemPending && itemOverdue && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">
                                <AlertTriangle size={10} />+{overtimeMinutes}m
                              </span>
                            )}
                          </div>

                          {/* Prep time info */}
                          <div className="mt-1 text-xs text-gray-500">
                            Thời gian chuẩn bị: {itemPrepTime} phút
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
                                  {mod.name || mod.modifier_name}
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

                        {/* Nút hoàn thành từng item */}
                        {isItemPending && onUpdateItemStatus && (
                          <button
                            onClick={() =>
                              onUpdateItemStatus(order.id, it.id, "ready")
                            }
                            className="shrink-0 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
                            title="Đánh dấu hoàn thành món này"
                          >
                            <Check size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isUrgent
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-900/30 animate-pulse"
                    : "bg-green-600 hover:bg-green-500 text-white shadow-green-900/20"
                }`}
              >
                <CheckCircle2 size={20} />
                {isUrgent ? "Hoàn thành ngay!" : "Hoàn thành đơn"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
