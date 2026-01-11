import React from "react";

export default function StatusBadge({ status }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        Chờ xử lý
      </span>
    );
  }
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Đã chấp nhận
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Đã từ chối
    </span>
  );
}
