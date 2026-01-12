import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ShoppingBag, Flame, Check } from "lucide-react";
import FoodDetailPopup from "./DetailFoodPopup";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, selectTotalItems } from "../../store/slices/cartSlice";
import { toast } from "react-toastify";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { menuApi } from "../../services/menuApi";

const PAGE_SIZE = 12;

const MenuSkeletonCard = () => (
  <div className="flex gap-4 p-3 rounded-2xl border border-white/5 bg-white/0">
    <div className="w-28 h-28 rounded-xl bg-white/5 animate-pulse" />
    <div className="flex-1 py-1">
      <div className="h-5 w-2/3 bg-white/5 rounded animate-pulse" />
      <div className="mt-2 h-4 w-full bg-white/5 rounded animate-pulse" />
      <div className="mt-2 h-4 w-5/6 bg-white/5 rounded animate-pulse" />
      <div className="mt-4 flex items-end justify-between">
        <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
        <div className="h-9 w-9 bg-white/5 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

const MenuSkeleton = ({ count = PAGE_SIZE }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
    {Array.from({ length: count }).map((_, i) => (
      <MenuSkeletonCard key={i} />
    ))}
  </div>
);

export default function Menu() {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectTotalItems);
  const { tableCode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // ===== categories =====
  const [categories, setCategories] = useState([{ id: "all", name: "All" }]);

  // ===== filters =====
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [sort, setSort] = useState("newest"); // newest | popularity
  const [onlyChef, setOnlyChef] = useState(false);

  // ✅ inputSearch: gõ không gọi API
  // ✅ appliedSearch: bấm Search/Enter mới gọi
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // ===== list state =====
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loadingFirst, setLoadingFirst] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // ===== UI =====
  const [selectedFood, setSelectedFood] = useState(null);
  const [addedItems, setAddedItems] = useState(new Set());

  // ===== refs =====
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const abortRef = useRef(null); // AbortController (chỉ abort khi đổi filter)
  const requestKeyRef = useRef(""); // chống gọi trùng
  const inFlightRef = useRef(false); // ✅ khóa chống spam
  const userTriggeredRef = useRef(false); // ✅ tránh auto-load khi đang lỗi

  // stable refs for observer callback
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingFirstRef = useRef(true);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    loadingFirstRef.current = loadingFirst;
  }, [loadingFirst]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  // ===== URL sync (debounced) =====
  const urlTimerRef = useRef(null);
  const syncUrl = useCallback(
    (next, { replace = true } = {}) => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);

      urlTimerRef.current = setTimeout(() => {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);

          const search = next.search ?? "";
          const category_id = next.category_id ?? "all";
          const sortV = next.sort ?? "newest";
          const chef = next.chef ?? "0";
          const pageV = next.page ?? "1";

          if (search) p.set("search", search);
          else p.delete("search");

          if (category_id !== "all") p.set("category_id", category_id);
          else p.delete("category_id");

          if (sortV !== "newest") p.set("sort", sortV);
          else p.delete("sort");

          if (chef === "1") p.set("chef", "1");
          else p.delete("chef");

          p.set("page", String(pageV));
          return p;
        }, { replace });
      }, 80);
    },
    [setSearchParams]
  );

  // ===== init from URL (1 lần) =====
  useEffect(() => {
    const q = searchParams.get("search") || "";
    const cat = searchParams.get("category_id") || "all";
    const s = searchParams.get("sort") || "newest";
    const chef = (searchParams.get("chef") || "0") === "1";

    setSearchInput(q);
    setAppliedSearch(q);

    setActiveCategoryId(cat);
    setSort(s === "popularity" ? "popularity" : "newest");
    setOnlyChef(chef);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== load categories =====
  useEffect(() => {
    let mounted = true;

    const loadCats = async () => {
      try {
        const catsRes = await menuApi.getMenuCategories();
        const cats = (catsRes || [])
          .filter((c) => (c.status || "active") === "active")
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((c) => ({ id: c.id, name: c.name }));

        if (!mounted) return;
        setCategories([{ id: "all", name: "All" }, ...cats]);
      } catch {
        // ignore
      }
    };

    loadCats();
    return () => {
      mounted = false;
    };
  }, []);

  // ===== memo onPageSync (FIX spam request) =====
  const onPageSync = useCallback(
    (p) => {
      syncUrl({
        search: appliedSearch || "",
        category_id: activeCategoryId,
        sort,
        chef: onlyChef ? "1" : "0",
        page: String(p),
      });
    },
    [syncUrl, appliedSearch, activeCategoryId, sort, onlyChef]
  );

  // ===== fetchPage (locked) =====
  const fetchPage = useCallback(
    async (nextPage, { reason = "auto" } = {}) => {
      // nếu đang lỗi và auto trigger -> chặn (tránh loop)
      if (error && reason === "auto") return;

      const key = `${appliedSearch}|${activeCategoryId}|${sort}|${onlyChef}|${nextPage}`;
      if (requestKeyRef.current === key) return;

      if (inFlightRef.current) return; // ✅ chặn spam tuyệt đối
      inFlightRef.current = true;
      requestKeyRef.current = key;

      try {
        if (nextPage === 1) setLoadingFirst(true);
        else setLoadingMore(true);
        setError("");

        const controller = new AbortController();
        // chỉ abort khi đổi filter, nên không abort ở đây
        abortRef.current = controller;

        const params = {
          page: nextPage,
          limit: PAGE_SIZE,
          search: appliedSearch || undefined,
          category_id: activeCategoryId === "all" ? undefined : activeCategoryId,
          sort: sort || undefined,
          chef: onlyChef ? 1 : undefined,
        };

        const res = await menuApi.getMenuItems(params, { signal: controller.signal });

        const data = res?.data ?? res?.items ?? res?.data?.data ?? [];
        const meta = res?.meta ?? res?.data?.meta;

        const normalized = (data || []).map((it) => ({ ...it, image: it.image_url }));

        setItems((prev) => (nextPage === 1 ? normalized : prev.concat(normalized)));
        setPage(nextPage);

        const nextHasMore =
          meta && typeof meta.hasMore === "boolean"
            ? meta.hasMore
            : normalized.length === PAGE_SIZE;

        setHasMore(nextHasMore);

        onPageSync(nextPage);
      } catch (e) {
        if (e?.name === "CanceledError" || e?.name === "AbortError") return;
        setError(e?.message || "Load menu failed");
        setHasMore(false);
      } finally {
        if (nextPage === 1) setLoadingFirst(false);
        else setLoadingMore(false);
        inFlightRef.current = false;
      }
    },
    [appliedSearch, activeCategoryId, sort, onlyChef, onPageSync, error]
  );

  // ===== reset list when appliedSearch/category/sort/chef changes =====
  useEffect(() => {
    // abort in-flight request
    if (abortRef.current) abortRef.current.abort();

    // reset
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError("");
    requestKeyRef.current = "";
    inFlightRef.current = false;

    // sync url page=1
    syncUrl({
      search: appliedSearch || "",
      category_id: activeCategoryId,
      sort,
      chef: onlyChef ? "1" : "0",
      page: "1",
    });

    // load page 1
    fetchPage(1, { reason: "user" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, activeCategoryId, sort, onlyChef]);

  // ===== observer =====
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        if (inFlightRef.current) return;
        if (loadingFirstRef.current || loadingMoreRef.current) return;
        if (!hasMoreRef.current) return;

        fetchPage(pageRef.current + 1, { reason: "auto" });
      },
      { root: null, rootMargin: "650px", threshold: 0 }
    );

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [fetchPage, loadingFirst]);

  // ✅ auto-load if list short and sentinel is already in viewport
  useEffect(() => {
    if (loadingFirst || loadingMore) return;
    if (!hasMore) return;
    if (error) return; // ✅ lỗi thì không auto gọi nữa

    const el = sentinelRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 200) {
      fetchPage(page + 1, { reason: "auto" });
    }
  }, [items.length, loadingFirst, loadingMore, hasMore, error, page, fetchPage]);

  // ===== apply search (button/enter) =====
  const applySearch = useCallback(() => {
    const q = searchInput.trim();
    // nếu không đổi thì thôi
    if (q === appliedSearch) return;

    setAppliedSearch(q);
    // reset page url (effect reset sẽ fetch)
    syncUrl({
      search: q || "",
      category_id: activeCategoryId,
      sort,
      chef: onlyChef ? "1" : "0",
      page: "1",
    });
  }, [searchInput, appliedSearch, syncUrl, activeCategoryId, sort, onlyChef]);

  // ===== cart =====
  const handleAddToCart = (e, item) => {
    e.stopPropagation();

    dispatch(
      addToCart({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: item.image || null,
        category_id: item.category_id,
        status: item.status,
      })
    );

    setAddedItems((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });

    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 700);

    toast.success(`Đã thêm ${item.name} vào giỏ hàng!`, {
      position: "bottom-right",
      autoClose: 1200,
    });
  };

  const disabledSearch = useMemo(
    () => searchInput.trim() === appliedSearch.trim(),
    [searchInput, appliedSearch]
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans selection:bg-orange-500 selection:text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/98 backdrop-blur-2xl shadow-2xl py-4">
        <div className="px-4 container mx-auto max-w-5xl">
          {/* Search */}
          <div className="flex gap-2 items-center max-w-lg mx-auto mb-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
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
                className={onlyChef ? "text-white fill-white" : "text-orange-500 fill-orange-500"}
              />
              Chef’s picks
            </button>
          </div>

          {/* Categories + cart */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 select-none scroll-smooth pr-16">
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

      {/* LIST */}
      <div className="container mx-auto max-w-5xl px-4 pt-4">
        {loadingFirst ? (
          <MenuSkeleton count={PAGE_SIZE} />
        ) : error && items.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <div className="text-gray-300">Lỗi: {error}</div>
            <button
              onClick={() => fetchPage(1, { reason: "user" })}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
            >
              Thử lại
            </button>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFood(item)}
                  className="group flex gap-4 bg-transparent hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5 cursor-pointer"
                >
                  <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden relative bg-white/5">
                    <img
                      src={item.image || "https://via.placeholder.com/400x400?text=No+Image"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    {item.status && item.status !== "available" && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-xs font-bold">
                        {item.status}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        {item.is_chef_recommended && (
                          <Flame size={14} className="text-orange-500 fill-orange-500 ml-2 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <span className="text-xl font-black text-white">${Number(item.price).toFixed(2)}</span>

                      <button
                        disabled={item.status && item.status !== "available"}
                        onClick={(e) => handleAddToCart(e, item)}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-lg active:scale-90 relative ${
                          item.status && item.status !== "available"
                            ? "bg-neutral-800 border-white/10 text-gray-600 cursor-not-allowed"
                            : addedItems.has(item.id)
                            ? "bg-green-500 border-green-500 text-white"
                            : "bg-neutral-800 border-white/10 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500"
                        }`}
                      >
                        {addedItems.has(item.id) ? <Check size={18} className="animate-bounce" /> : <ShoppingBag size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* sentinel */}
            <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center mt-6 border-t border-white/5">
              {loadingMore ? (
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/15 border-t-orange-500" />
                  Đang tải thêm...
                </div>
              ) : !hasMore ? (
                <span className="text-gray-600 text-sm">— Bạn đã xem hết menu —</span>
              ) : error ? (
                <button
                  onClick={() => fetchPage(pageRef.current + 1, { reason: "user" })}
                  className="text-orange-400 text-sm hover:underline"
                >
                  Lỗi tải thêm, bấm để thử lại
                </button>
              ) : (
                <span className="text-gray-500 text-sm">Kéo xuống để tải thêm…</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 opacity-60">
            <p>Không tìm thấy món nào phù hợp.</p>
          </div>
        )}
      </div>

      {selectedFood && <FoodDetailPopup food={selectedFood} onClose={() => setSelectedFood(null)} />}
    </div>
  );
}
