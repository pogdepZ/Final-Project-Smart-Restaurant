import React from "react";

export default function TopListCard({
  title,
  subtitle,
  badge,
  columns = [],
  rows = [],
  rightAlignLast = true,
}) {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/10 shadow-2xl overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white font-black text-lg">{title}</div>
            {subtitle ? <div className="text-gray-400 text-sm mt-1">{subtitle}</div> : null}
          </div>
          {badge ? (
            <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs text-center font-bold">
              {badge}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">
          {columns.map((c, idx) => (
            <div
              key={idx}
              className={[
                c.span ? `col-span-${c.span}` : "col-span-6",
                rightAlignLast && idx === columns.length - 1 ? "text-right" : "",
                rightAlignLast && idx === columns.length - 3 ? "text-right" : "",
              ].join(" ")}
            >
              {c.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={r.key || i}
              className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-black/25 border border-white/5 hover:bg-white/5 transition-colors"
            >
              {/* Rank */}
              <div className="col-span-1">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 font-black text-xs flex items-center justify-center">
                  {i + 1}
                </div>
              </div>

              {/* Main */}
              <div className="col-span-7 min-w-0 pl-3">
                <div className="text-white font-bold truncate">{r.title}</div>
              </div>

              {/* Value */}
              <div className="col-span-4 text-right">
                <div className="text-white font-black">{r.value}</div>
                {r.valueHint ? <div className="text-gray-500 text-xs">{r.valueHint}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
