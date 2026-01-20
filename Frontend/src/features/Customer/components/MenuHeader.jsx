import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ShoppingBag, Flame, Sparkles } from "lucide-react";

export default function MenuHeader({
  tableCode,
  cartCount = 0,

  searchInput,
  setSearchInput,
  applySearch,
  disabledSearch,

  sort,
  setSort,

  onlyChef,
  setOnlyChef,

  categories = [],
  activeCategoryId,
  setActiveCategoryId,

  // Fuzzy search props
  fuzzyResultCount = null,
  isFuzzySearchActive = false,
  totalItemsCount = 0,
}) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/98 backdrop-blur-2xl shadow-2xl py-2 md:py-4 transition-all duration-300">
      <div className="px-3 md:px-4 container mx-auto max-w-5xl">
        {/* --- DÒNG 1: SEARCH --- */}
        <div className="flex gap-2 items-center max-w-lg mx-auto mb-2 md:mb-3 transition-all">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all"
              size={18}
            />
            <input
              type="text"
              placeholder={t("menu.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full 
                         pl-10 md:pl-12 pr-4 py-2 md:py-2.5 
                         text-sm text-white placeholder-gray-500 
                         focus:outline-none focus:border-orange-500/50 
                         transition-all duration-200 shadow-lg"
            />
            {/* Fuzzy search indicator */}
            {isFuzzySearchActive && searchInput.trim().length >= 2 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Sparkles size={14} className="text-orange-400" />
                <span className="text-xs text-orange-400 font-medium">
                  {fuzzyResultCount}/{totalItemsCount}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={applySearch}
            disabled={disabledSearch}
            className={`hidden sm:block px-5 py-2.5 rounded-full text-sm font-black transition active:scale-95 whitespace-nowrap ${
              disabledSearch
                ? "bg-neutral-800 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:opacity-95"
            }`}
          >
            {t("menu.searchButton")}
          </button>
        </div>

        {/* --- DÒNG 2: SORT & FILTER --- */}
        <div className="flex items-center justify-between gap-3 mt-3 max-w-5xl mx-auto mb-2 md:mb-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden xs:inline">
              {t("menu.sort")}:
            </span>{" "}
            {/* Ẩn chữ 'Sort:' nếu màn hình quá bé */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-neutral-900 border border-neutral-800 text-gray-200 text-xs rounded-lg px-3 py-1.5 md:py-2 outline-none focus:border-orange-500/50 cursor-pointer"
              >
                <option value="newest">{t("menu.sortNewest")}</option>
                <option value="popularity">{t("menu.sortPopularity")}</option>
              </select>
            </div>
          </div>

          {/* Chef Pick Button */}
          <button
            onClick={() => setOnlyChef((v) => !v)}
            className={`inline-flex items-center gap-1.5 md:gap-2 text-xs font-bold rounded-full px-3 py-1.5 md:py-2 border transition-all select-none ${
              onlyChef
                ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)]"
                : "bg-neutral-900 border-neutral-800 text-gray-300 hover:border-orange-500/50"
            }`}
          >
            <Flame
              size={14}
              className={`transition-colors duration-300 ${
                onlyChef
                  ? "text-white fill-white"
                  : "text-orange-500 fill-orange-500"
              }`}
            />
            <span className="hidden xs:inline">Chef’s picks</span>{" "}
            {/* Ẩn chữ trên màn hình cực nhỏ */}
            <span className="inline xs:hidden">{t("menu.chef")}</span>{" "}
            {/* Hiện chữ ngắn gọn */}
          </button>
        </div>

        {/* --- DÒNG 3: CATEGORIES & CART --- */}
        <div className="relative group/cat">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pt-1 select-none scroll-smooth pr-14 md:pr-16 touch-pan-x"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {categories.length > 0
              ? categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategoryId(c.id)}
                    className={`whitespace-nowrap rounded-full font-bold tracking-wide transition-all duration-200 border shrink-0 px-3 md:px-4 py-1.5 text-xs ${
                      activeCategoryId === c.id
                        ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.35)]"
                        : "bg-neutral-900 border-neutral-800 text-gray-400 hover:border-orange-500/50 hover:text-white"
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              : // Loading skeleton
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-7 w-20 bg-neutral-900 rounded-full animate-pulse border border-neutral-800 shrink-0"
                  />
                ))}
          </div>

          {/* Gradient mờ bên phải để tạo cảm giác scroll */}
          <div className="absolute right-0 top-0 bottom-1 w-16 md:w-24 bg-gradient-to-l from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none z-10" />

          {/* Nút Cart */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none z-20 pb-0.5 md:pb-1">
            <Link
              to={tableCode ? `/cart/${tableCode}` : "/cart"}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto
                  h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/10
                  bg-neutral-900/95 backdrop-blur-md
                  flex items-center justify-center
                  text-gray-200 hover:text-orange-500
                  hover:border-orange-500/40 hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]
                  transition-all active:scale-95 relative"
            >
              <ShoppingBag size={18} className="md:w-5 md:h-5" />{" "}
              {/* Icon nhỏ hơn xíu trên mobile */}
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] md:min-w-5 md:h-5 px-1
            bg-orange-500 text-white text-[10px] md:text-[11px] font-black
            rounded-full flex items-center justify-center
            shadow-[0_0_0_2px_rgba(10,10,10,0.9)]"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
