import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export default function MultiSelectCombobox({
  options = [],            // [{ value, label, subLabel? }]
  value = [],              // array of value
  onChange,
  placeholder = "Chọn...",
  disabled = false,
  maxHeight = 260,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedSet = useMemo(() => new Set(value || []), [value]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => {
      const text = `${o.label} ${o.subLabel || ""}`.toLowerCase();
      return text.includes(s);
    });
  }, [options, q]);

  const selectedLabels = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return (value || []).map((v) => map.get(v)).filter(Boolean);
  }, [options, value]);

  const toggle = (v) => {
    if (disabled) return;
    const next = selectedSet.has(v)
      ? (value || []).filter((x) => x !== v)
      : [...(value || []), v];
    onChange?.(next);
  };

  const clearAll = (e) => {
    e?.stopPropagation();
    if (disabled) return;
    onChange?.([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-neutral-950/60 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition disabled:opacity-60"
      >
        <div className="flex-1 text-left">
          {selectedLabels.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedLabels.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-200"
                >
                  {t}
                </span>
              ))}
              {selectedLabels.length > 3 ? (
                <span className="text-xs text-gray-400">
                  +{selectedLabels.length - 3} nữa
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedLabels.length ? (
            <span
              onClick={clearAll}
              className="p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="Clear"
              role="button"
            >
              <X size={14} className="text-gray-300" />
            </span>
          ) : null}
          <ChevronDown size={18} className="text-gray-300" />
        </div>
      </button>

      {/* Dropdown */}
      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm modifier group..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40"
            />
          </div>

          <div
            className="overflow-auto"
            style={{ maxHeight }}
          >
            {filtered.length ? (
              filtered.map((o) => {
                const checked = selectedSet.has(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition flex items-start gap-3"
                  >
                    <div
                      className={`mt-1 h-4 w-4 rounded border ${checked
                          ? "bg-orange-500/30 border-orange-500/40"
                          : "bg-transparent border-white/20"
                        }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white font-semibold">
                        {o.label}
                      </div>
                      {o.subLabel ? (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {o.subLabel}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-sm text-gray-500">
                Không có kết quả
              </div>
            )}
          </div>

          <div className="p-2 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Đã chọn: {(value || []).length}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition text-xs"
            >
              Xong
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
