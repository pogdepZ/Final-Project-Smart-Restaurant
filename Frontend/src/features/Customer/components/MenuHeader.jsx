import React from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Flame } from "lucide-react";

export default function MenuHeader({
  tableCode,
  cartCount,

  searchInput,
  setSearchInput,
  applySearch,
  disabledSearch,

  sort,
  setSort,

  onlyChef,
  setOnlyChef,

  categories,
  activeCategoryId,
  setActiveCategoryId,
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/98 backdrop-blur-2xl shadow-2xl py-4">
      <div className="px-4 container mx-auto max-w-5xl">
        {/* Search */}
        <div className="flex gap-2 items-center max-w-lg mx-auto mb-3">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Bạn muốn ăn gì hôm nay?..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-12 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all duration-200 shadow-lg"
            />
          </div>

          <button
            onClick={applySearch}
            disabled={disabledSearch}
            className={`px-4 py-2.5 rounded-full text-sm font-black transition active:scale-95 ${
              disabledSearch
                ? "bg-neutral-800 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:opacity-95"
            }`}
          >
            Search
          </button>
        </div>

        {/* Sort + Chef */}
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
            <Flame
              size={14}
              className={
                onlyChef
                  ? "text-white fill-white"
                  : "text-orange-500 fill-orange-500"
              }
            />
            Chef’s picks
          </button>
        </div>

        {/* Categories + cart */}
        <div className="relative">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 select-none scroll-smooth pr-16 touch-pan-x"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategoryId(c.id)}
                className={`whitespace-nowrap rounded-full font-bold tracking-wide transition-all duration-200 border shrink-0 px-4 py-1.5 text-xs ${
                  activeCategoryId === c.id
                    ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)]"
                    : "bg-neutral-900 border-neutral-800 text-gray-400 hover:border-orange-500/50 hover:text-white"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* ✅ wrapper không ăn gesture kéo ngang */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
            <Link
              to={tableCode ? `/cart/${tableCode}` : "/cart"}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto
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
    </div>
  );
}
