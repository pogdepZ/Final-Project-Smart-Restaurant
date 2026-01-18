import React, { useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Table2,
  Eye,
  Bell,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { calcTotal, formatMoneyVND, formatTime } from "../utils/orders";
import OrderTimer from "./OrderTimer";

export default function OrderCard({ order, onView, onAccept, onReject }) {
  const total = calcTotal(order);

  // Tính prep_time lớn nhất và kiểm tra urgent
  const { maxPrepTime, isUrgent, isWarning } = useMemo(() => {
    const items = order.items || [];
    const max = Math.max(...items.map((it) => it.prep_time_minutes || 15), 15);
    const elapsed = (Date.now() - new Date(order.created_at).getTime()) / 60000;

    return {
      maxPrepTime: max,
      isUrgent: elapsed >= max,
      isWarning: elapsed >= max * 0.75 && elapsed < max,
    };
  }, [order]);

  // Chỉ hiện timer cho các đơn chưa hoàn thành
  const showTimer = !["completed", "rejected"].includes(order.status);

  return (
    <div
      className={`rounded-2xl bg-neutral-900/60 border shadow-2xl overflow-hidden h-full flex flex-col transition-all ${
        isUrgent && showTimer
          ? "border-red-500/50 ring-2 ring-red-500/20"
          : isWarning && showTimer
          ? "border-yellow-500/30"
          : "border-white/10"
      }`}
    >
      {/* Urgent Banner */}
      {isUrgent && showTimer && (
        <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/30 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400 animate-bounce" />
          <span className="text-red-400 text-xs font-bold uppercase tracking-wide">
            Đơn trễ - Cần xử lý ngay!
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-white font-black text-lg">{order.id}</div>
              <StatusBadge status={order.status} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="inline-flex items-center gap-2">
                <Table2 size={16} className="text-orange-500" />
                <span className="font-semibold text-gray-200">
                  {order.table_id || "—"}
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                <span>{formatTime(order.created_at)}</span>
              </div>

              {/* Timer */}
              {showTimer && (
                <OrderTimer
                  createdAt={order.created_at}
                  estimatedMinutes={maxPrepTime}
                  size="small"
                />
              )}
            </div>

            <div className="mt-3 text-gray-400 text-sm">
              {order.items.slice(0, 2).map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="truncate">
                    {it.qty}× {it.name}
                  </span>
                  <span className="text-gray-300">
                    {formatMoneyVND(it.qty * it.price)}
                  </span>
                </div>
              ))}
              {order.items.length > 2 && (
                <div className="text-xs text-gray-500 mt-1">
                  +{order.items.length - 2} món khác
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-gray-400 text-xs">Tổng</div>
            <div className="text-white font-black text-xl">
              {formatMoneyVND(total)}
            </div>
          </div>
        </div>

        {order.note ? (
          <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 text-sm text-gray-300">
            <span className="text-gray-500">Ghi chú: </span>
            {order.note}
          </div>
        ) : null}

        <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            Xem chi tiết
          </button>

          {order.status === "received" ? (
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
                className={`px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 inline-flex items-center justify-center gap-2 ${
                  isUrgent
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                }`}
              >
                <CheckCircle2 size={18} />
                {isUrgent ? "Chấp nhận ngay!" : "Chấp nhận"}
              </button>
            </>
          ) : (
            <div className="sm:ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 border border-white/5 text-gray-300">
              <Bell size={18} className="text-orange-500" />
              <span className="text-sm">Đơn đã xử lý</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
