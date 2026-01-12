import React from "react";

export default function ToggleSwitch({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();     // ✅ chặn không cho bubble lên <tr>
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition
        ${checked
          ? "bg-orange-500/20 border-orange-500/30"
          : "bg-white/5 border-white/10"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/10"}`}
      aria-pressed={checked}
      aria-label={label || "toggle"}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full transition
          ${checked ? "translate-x-5 bg-orange-400" : "translate-x-1 bg-gray-300"}`}
      />
    </button>
  );
}
