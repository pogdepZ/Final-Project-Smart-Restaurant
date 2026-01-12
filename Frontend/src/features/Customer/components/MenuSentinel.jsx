import React from "react";

export default function MenuSentinel({
  sentinelRef,
  loadingMore,
  hasMore,
  error,
  onRetryLoadMore,
}) {
  return (
    <div
      ref={sentinelRef}
      className="h-20 w-full flex items-center justify-center mt-6 border-t border-white/5"
    >
      {loadingMore ? (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/15 border-t-orange-500" />
          Đang tải thêm...
        </div>
      ) : !hasMore ? (
        <span className="text-gray-600 text-sm">— Bạn đã xem hết menu —</span>
      ) : error ? (
        <button
          onClick={onRetryLoadMore}
          className="text-orange-400 text-sm hover:underline"
        >
          Lỗi tải thêm, bấm để thử lại
        </button>
      ) : (
        <span className="text-gray-500 text-sm">Kéo xuống để tải thêm…</span>
      )}
    </div>
  );
}
