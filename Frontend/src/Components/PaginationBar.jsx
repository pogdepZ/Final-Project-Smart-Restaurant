import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationBar({
  page,
  totalPages,
  total,
  limit,
  onPrev,
  onNext,
  onChangeLimit,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t border-white/10 bg-neutral-950/40">
      <div className="text-xs text-gray-400">
        Tổng <span className="text-white font-bold">{total ?? "—"}</span> • Trang{" "}
        <span className="text-white font-bold">{page}</span> /{" "}
        <span className="text-white font-bold">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={limit}
          onChange={(e) => onChangeLimit(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40"
        >
          {[10, 20, 30, 50].map((n) => (
            <option key={n} value={n} className="bg-neutral-900">
              {n} / trang
            </option>
          ))}
        </select>

        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-white/5"
          type="button"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-white/5"
          type="button"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
