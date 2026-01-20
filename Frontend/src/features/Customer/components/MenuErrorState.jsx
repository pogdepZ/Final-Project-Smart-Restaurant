import React from "react";
import { useTranslation } from "react-i18next";

export default function MenuErrorState({ error, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="text-gray-300">
        {t("errors.error")}: {error}
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
