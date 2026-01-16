import React, { useState, useEffect, useMemo } from "react";
import { Clock, AlertTriangle } from "lucide-react";

export default function OrderTimer({
  createdAt,
  estimatedMinutes = 15,
  showLabel = true,
  size = "default", // "small" | "default" | "large"
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!createdAt) return;

    const calculateElapsed = () => {
      const diff = Date.now() - new Date(createdAt).getTime();
      return Math.floor(diff / 1000); // seconds
    };

    setElapsed(calculateElapsed());

    const timer = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  const elapsedMinutes = Math.floor(elapsed / 60);
  const elapsedSeconds = elapsed % 60;

  // Trạng thái cảnh báo
  const status = useMemo(() => {
    const ratio = elapsedMinutes / estimatedMinutes;
    if (ratio >= 1) return "overdue"; // Vượt quá thời gian
    if (ratio >= 0.75) return "warning"; // Sắp hết thời gian (75%)
    return "normal";
  }, [elapsedMinutes, estimatedMinutes]);

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const sizeClasses = {
    small: "text-xs px-2 py-1",
    default: "text-sm px-3 py-1.5",
    large: "text-base px-4 py-2",
  };

  const iconSize = {
    small: 12,
    default: 14,
    large: 18,
  };

  const statusStyles = {
    normal: "bg-white/5 border-white/10 text-gray-300",
    warning:
      "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 animate-pulse",
    overdue: "bg-red-500/15 border-red-500/40 text-red-400",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-bold ${sizeClasses[size]} ${statusStyles[status]}`}
      title={`Thời gian ước tính: ${estimatedMinutes} phút`}
    >
      {status === "overdue" ? (
        <AlertTriangle size={iconSize[size]} className="animate-bounce" />
      ) : (
        <Clock size={iconSize[size]} />
      )}

      <span>{formatTime(elapsedMinutes, elapsedSeconds)}</span>

      {showLabel && (
        <span className="text-[10px] opacity-70">/ {estimatedMinutes}m</span>
      )}
    </div>
  );
}

// Component hiển thị tổng hợp trạng thái items trong order
export function OrderItemsTimerSummary({ items = [], createdAt }) {
  // Tính prep_time lớn nhất trong các món
  const maxPrepTime = useMemo(() => {
    if (!items.length) return 15;
    return Math.max(...items.map((it) => it.prep_time_minutes || 15));
  }, [items]);

  // Đếm số món đang overdue
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    if (!createdAt) return;

    const checkOverdue = () => {
      const elapsedMins = (Date.now() - new Date(createdAt).getTime()) / 60000;
      const count = items.filter((it) => {
        const prepTime = it.prep_time_minutes || 15;
        return elapsedMins > prepTime;
      }).length;
      setOverdueCount(count);
    };

    checkOverdue();
    const timer = setInterval(checkOverdue, 30000); // Check mỗi 30s

    return () => clearInterval(timer);
  }, [items, createdAt]);

  if (overdueCount === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold animate-pulse">
      <AlertTriangle size={12} />
      <span>{overdueCount} món trễ</span>
    </div>
  );
}
