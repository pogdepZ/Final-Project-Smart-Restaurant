import React from "react";
import { useTranslation } from "react-i18next";

export default function MenuEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20 opacity-60">
      <p>{t("menu.noItemsFound")}</p>
    </div>
  );
}
