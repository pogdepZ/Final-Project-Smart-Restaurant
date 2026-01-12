import React from "react";

export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/10 shadow-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              {label}
            </div>
            <div className="mt-2 text-white font-black text-3xl">{value}</div>
            {hint ? <div className="mt-2 text-gray-500 text-sm">{hint}</div> : null}
          </div>

          {Icon ? (
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Icon className="text-orange-500" size={22} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="h-1 bg-linear-to-r from-orange-500/40 to-red-500/20" />
    </div>
  );
}
