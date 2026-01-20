import React from "react";
import { useTranslation } from "react-i18next";

export default function MenuSentinel({
  sentinelRef,
  loadingMore,
  hasMore,
  error,
  onRetryLoadMore,
}) {
  const { t } = useTranslation();
  return (
    <div
      ref={sentinelRef}
      className="h-20 w-full flex items-center justify-center mt-6 border-t border-white/5"
    >
      {loadingMore ? (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/15 border-t-orange-500" />
          {t("menu.loadingMore")}
        </div>
      ) : !hasMore ? (
        <span className="text-gray-600 text-sm">— {t("menu.endOfMenu")} —</span>
      ) : error ? (
        <button
          onClick={onRetryLoadMore}
          className="text-orange-400 text-sm hover:underline"
        >
          {t("menu.loadMoreError")}
        </button>
      ) : (
        <span className="text-gray-500 text-sm">
          {t("menu.scrollToLoadMore")}
        </span>
      )}
    </div>
  );
}
