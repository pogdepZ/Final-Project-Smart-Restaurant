// src/pages/Menu/components/CategoryChips.jsx
import React from "react";

export default function CategoryChips({ categories, activeId, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 select-none scroll-smooth pr-16">
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`whitespace-nowrap rounded-full font-bold tracking-wide transition-all duration-200 border shrink-0 px-4 py-1.5 text-xs ${
            activeId === c.id
              ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)]"
              : "bg-neutral-900 border-neutral-800 text-gray-400 hover:border-orange-500/50 hover:text-white"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
