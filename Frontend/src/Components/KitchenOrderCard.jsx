import React from "react";
import {
  Clock,
  Table2,
  CheckCircle2,
  Eye,
  PlayCircle,
  AlertTriangle,
  Check,
  XCircle,
} from "lucide-react";
import { formatTime } from "../utils/orders";
import OrderTimer, { OrderItemsTimerSummary } from "./OrderTimer";

export default function KitchenOrderCard({
  order,
  onView,
  onStart,
  onComplete,
  onUpdateItemStatus,
}) {
  if (!order) return null;

  const items = order.items || [];
  // console.log(">>>>>> order items:", items);

  const totalItems = items.reduce(
    (acc, item) => acc + (Number(item.qty) || 0),
    0,
  );

  // Đếm số item đã hoàn thành
  const completedItems = items.filter(
    (it) => it.status === "ready" || it.status === "rejected",
  ).length;
  const pendingItems = items.filter(
    (it) => it.status !== "ready" && it.status !== "rejected",
  );

  // Kiểm tra tất cả items đã xong chưa
  const allItemsDone = items.every(
    (it) => it.status === "ready" || it.status === "rejected",
  );

  // Tính prep_time lớn nhất trong các món để hiển thị timer chính
  const maxPrepTime = Math.max(
    ...items.map((it) => it.prep_time_minutes || 15),
    15,
  );

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
  const isUrgent = elapsed >= maxPrepTime;
  const isWarning = elapsed >= maxPrepTime * 0.75 && !isUrgent;

  return (
    <div
      className={`rounded-2xl bg-neutral-900/60 border shadow-2xl overflow-hidden h-full flex flex-col transition-all ${
        isUrgent
          ? "border-red-500/50 ring-2 ring-red-500/20"
          : isWarning
            ? "border-yellow-500/30"
            : "border-white/10"
      }`}
    >
      {/* Urgent Banner */}
      {isUrgent && (
        <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/30 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400 animate-bounce" />
          <span className="text-red-400 text-xs font-bold uppercase tracking-wide">
            Đơn trễ - Cần ưu tiên!
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white font-black text-lg">#{order.id.slice(0, 8)}</div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="inline-flex items-center gap-2">
                <Table2 size={16} className="text-orange-500" />
                <span className="font-semibold text-gray-200">
                  {order.table_number || "Mang về"}
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                <span>{formatTime(order.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Timer chính */}
            <OrderTimer
              createdAt={order.created_at}
              estimatedMinutes={maxPrepTime}
              size="default"
            />

            <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold">
              {completedItems}/{items.length} món xong
            </div>
          </div>
        </div>

        {/* Items với indicator thời gian riêng */}
        <div className="mt-4 space-y-2">
          {(items || []).slice(0, 4).map((it, idx) => {
            const itemPrepTime = it.prep_time_minutes || 15;
            const itemOverdue = elapsed >= itemPrepTime;
            const isItemReady = it.status === "ready";
            const isItemRejected = it.status === "rejected";
            const isItemPending = !isItemReady && !isItemRejected;

            return (
              <div
                key={it.id || idx}
                className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-all ${
                  isItemReady
                    ? "bg-green-500/10 border border-green-500/20"
                    : isItemRejected
                      ? "bg-red-500/10 border border-red-500/20 opacity-50"
                      : itemOverdue
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-white/5"
                }`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  {isItemReady && (
                    <Check size={14} className="text-green-400 shrink-0" />
                  )}
                  {isItemRejected && (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                  {isItemPending && itemOverdue && (
                    <AlertTriangle
                      size={14}
                      className="text-red-400 shrink-0"
                    />
                  )}
                  <div
                    className={`font-semibold truncate ${
                      isItemReady
                        ? "text-green-300 line-through"
                        : isItemRejected
                          ? "text-red-300 line-through"
                          : itemOverdue
                            ? "text-red-300"
                            : "text-white"
                    }`}
                  >
                    {it.item_name || it.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isItemPending && itemOverdue && (
                    <span className="text-[10px] text-red-400 font-mono">
                      +{elapsed - itemPrepTime}m
                    </span>
                  )}
                  <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm font-bold">
                    x{it.qty}
                  </div>
                  {/* Nút hoàn thành từng item */}
                  {isItemPending && onUpdateItemStatus && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateItemStatus(order.id, it.id, "ready");
                      }}
                      className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
                      title="Đánh dấu hoàn thành"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {(items || []).length > 4 && (
            <div className="text-xs text-gray-500">
              +{items.length - 4} món khác
            </div>
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

          <button
            onClick={onComplete}
            disabled={!allItemsDone}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 inline-flex items-center justify-center gap-2 ${
              !allItemsDone
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : isUrgent
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            }`}
          >
            <CheckCircle2 size={18} />
            {!allItemsDone
              ? `${completedItems}/${items.length} xong`
              : isUrgent
                ? "Hoàn thành ngay!"
                : "Hoàn thành đơn"}
          </button>
        </div>
      </div>
    </div>
  );
}
