import React from "react";
import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { t } = useTranslation();
  // Table number placeholder - would come from LocalStorage or URL
  const tableNumber = t("table.tableNumber", { number: "05" });

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-40 px-4 flex items-center justify-between">
      {/* 1. Logo & Restaurant name */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          SR
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg leading-tight">
            Smart Resto
          </h1>
          <p className="text-xs text-gray-500">{t("header.tagline")}</p>
        </div>
      </Link>

      {/* 2. Table info & Service call button */}
      <div className="flex items-center gap-3">
        {/* Table number badge */}
        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
          {tableNumber}
        </div>

        {/* Quick search button (Optional) */}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <Search size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
