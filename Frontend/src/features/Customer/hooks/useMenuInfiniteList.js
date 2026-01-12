// src/pages/Menu/hooks/useMenuInfiniteList.js
import { useCallback, useEffect, useRef, useState } from "react";
import { menuApi } from "../../../services/menuApi";

const PAGE_SIZE = 12;

export function useMenuInfiniteList({
  appliedSearch,
  categoryId,
  sort,
  onlyChef,
  onPageSync, // ✅ phải là useCallback từ Menu.jsx
}) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loadingFirst, setLoadingFirst] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

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

  // ✅ lock chống spam request
  const inFlightRef = useRef(false);

  // abort only when filters change (reset)
  const abortRef = useRef(null);

  // avoid duplicate calls for same page+filters
  const requestKeyRef = useRef("");

  const fetchPage = useCallback(
    async (nextPage, { reason = "auto" } = {}) => {
      // nếu đang lỗi thì không auto gọi tiếp (tránh loop)
      if (error && reason === "auto") return;
      if (inFlightRef.current) return;

      const key = `${appliedSearch}|${categoryId}|${sort}|${onlyChef}|${nextPage}`;
      if (requestKeyRef.current === key) return;
      requestKeyRef.current = key;

      inFlightRef.current = true;

      try {
        if (nextPage === 1) setLoadingFirst(true);
        else setLoadingMore(true);

        setError("");

        const controller = new AbortController();
        abortRef.current = controller;

        const params = {
          page: nextPage,
          limit: PAGE_SIZE,
          search: appliedSearch || undefined,
          category_id: categoryId === "all" ? undefined : categoryId,
          sort: sort || undefined,
          chef: onlyChef ? 1 : undefined,
        };

        const res = await menuApi.getMenuItems(params, {
          signal: controller.signal,
        });

        const data = res?.data ?? res?.items ?? res?.data?.data ?? [];
        const meta = res?.meta ?? res?.data?.meta;

        const normalized = (data || []).map((it) => ({
          ...it,
          image: it.image_url,
        }));

        setItems((prev) => (nextPage === 1 ? normalized : prev.concat(normalized)));
        setPage(nextPage);

        const nextHasMore =
          meta && typeof meta.hasMore === "boolean"
            ? meta.hasMore
            : normalized.length === PAGE_SIZE;

        setHasMore(nextHasMore);

        // sync url page after success
        onPageSync?.(nextPage);
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
    [appliedSearch, categoryId, sort, onlyChef, onPageSync, error]
  );

  // reset & load page1 when filters change (appliedSearch)
  useEffect(() => {
    // abort in-flight on reset
    if (abortRef.current) abortRef.current.abort();

    setItems([]);
    setPage(1);
    setHasMore(true);
    setError("");

    requestKeyRef.current = "";
    inFlightRef.current = false;

    fetchPage(1, { reason: "user" });
  }, [appliedSearch, categoryId, sort, onlyChef, fetchPage]);

  // IntersectionObserver
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
  }, [fetchPage]);

  // ✅ Auto-load nếu list ngắn và sentinel đã ở trong viewport sau khi load xong
  useEffect(() => {
    if (loadingFirst || loadingMore) return;
    if (!hasMore) return;
    if (error) return;
    if (inFlightRef.current) return;

    const el = sentinelRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 200) {
      fetchPage(page + 1, { reason: "auto" });
    }
  }, [items.length, loadingFirst, loadingMore, hasMore, error, page, fetchPage]);

  return {
    items,
    page,
    hasMore,
    loadingFirst,
    loadingMore,
    error,
    sentinelRef,
    refetchFirst: () => fetchPage(1, { reason: "user" }),
    refetchMore: () => fetchPage(pageRef.current + 1, { reason: "user" }),
  };
}
