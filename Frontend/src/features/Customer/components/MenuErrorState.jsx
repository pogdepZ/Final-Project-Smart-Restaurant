import React from "react";

export default function MenuErrorState({ error, onRetry }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="text-gray-300">Lỗi: {error}</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
      >
        Thử lại
      </button>
    </div>
  );
}
