// src/pages/Menu/components/MenuHeader.jsx
import React from "react";
import { Search, Flame, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryChips from "./CategoryChips";

export default function MenuHeader({
  tableCode,
  cartCount,
  // search
  searchInput,
  setSearchInput,
  onSearchApply,
  // sort/filter
  sort,
  setSort,
  onlyChef,
  setOnlyChef,
  // categories
  categories,
  activeCategoryId,
  setActiveCategoryId,
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/98 backdrop-blur-2xl shadow-2xl py-4">
      <div className="px-4 container mx-auto max-w-5xl">
        {/* Search row */}
        <div className="flex gap-2 items-center max-w-lg mx-auto mb-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Bạn muốn ăn gì hôm nay?..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchApply();
              }}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-12 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all duration-200 shadow-lg"
            />
          </div>

          <button
            onClick={onSearchApply}
            className="px-4 py-2.5 rounded-full bg-orange-500 text-white text-sm font-black hover:opacity-95 active:scale-95 transition"
          >
            Search
          </button>
        </div>

        {/* Sort + chef */}
        <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-gray-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-orange-500/50"
            >
              <option value="newest">Newest</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          <button
            onClick={() => setOnlyChef((v) => !v)}
            className={`inline-flex items-center gap-2 text-xs font-bold rounded-full px-3 py-2 border transition-all ${
              onlyChef
                ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)]"
                : "bg-neutral-900 border-neutral-800 text-gray-300 hover:border-orange-500/50"
            }`}
            title="Chỉ hiện Chef's picks"
          >
            <Flame size={14} className={onlyChef ? "text-white fill-white" : "text-orange-500 fill-orange-500"} />
            Chef’s picks
          </button>
        </div>

        {/* Categories + cart */}
        <div className="relative">
          <CategoryChips
            categories={categories}
            activeId={activeCategoryId}
            onChange={setActiveCategoryId}
          />

          <Link
            to={tableCode ? `/cart/${tableCode}` : "/cart"}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-1/2 -translate-y-1/2
              h-10 w-10 rounded-full border border-white/10
              bg-neutral-900/90 backdrop-blur
              flex items-center justify-center
              text-gray-200 hover:text-orange-500
              hover:border-orange-500/40 hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]
              transition-all active:scale-95"
            aria-label="Giỏ hàng"
            title="Giỏ hàng"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1
                bg-orange-500 text-white text-[11px] font-black
                rounded-full flex items-center justify-center
                shadow-[0_0_0_3px_rgba(10,10,10,0.9)]"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
