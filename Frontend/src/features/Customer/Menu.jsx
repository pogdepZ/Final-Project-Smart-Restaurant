import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FoodDetailPopup from "./DetailFoodPopup";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, selectTotalItems } from "../../store/slices/cartSlice";
import { toast } from "react-toastify";
import { useParams, useSearchParams } from "react-router-dom";
import { menuApi } from "../../services/menuApi";

import MenuHeader from "./components/MenuHeader";
import MenuSkeleton from "./components/MenuSkeleton";
import MenuErrorState from "./components/MenuErrorState";
import MenuEmptyState from "./components/MenuEmptyState";
import MenuList from "./components/MenuList";

const PAGE_SIZE = 12;

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
        setSearchParams(
          (prev) => {
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
          },
          { replace }
        );
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
      <MenuHeader
        tableCode={tableCode}
        cartCount={cartCount}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        applySearch={applySearch}
        disabledSearch={disabledSearch}
        sort={sort}
        setSort={setSort}
        onlyChef={onlyChef}
        setOnlyChef={setOnlyChef}
        categories={categories}
        activeCategoryId={activeCategoryId}
        setActiveCategoryId={setActiveCategoryId}
      />

      {/* LIST */}
      <div className="container mx-auto max-w-5xl px-4 pt-4">
        {loadingFirst ? (
          <MenuSkeleton count={PAGE_SIZE} />
        ) : error && items.length === 0 ? (
          <MenuErrorState error={error} onRetry={() => fetchPage(1, { reason: "user" })} />
        ) : items.length > 0 ? (
          <MenuList
            items={items}
            addedItems={addedItems}
            onSelectFood={(item) => setSelectedFood(item)}
            onAddToCart={handleAddToCart}
            sentinelRef={sentinelRef}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onRetryLoadMore={() => fetchPage(pageRef.current + 1, { reason: "user" })}
          />
        ) : (
          <MenuEmptyState />
        )}
      </div>

      {selectedFood && (
        <FoodDetailPopup food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}
    </div>
  );
}
