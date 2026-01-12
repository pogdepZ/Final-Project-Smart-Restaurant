// src/pages/Menu/hooks/useMenuQuerySync.js
import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export function useMenuQuerySync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const timerRef = useRef(null);

  const readInitial = useCallback(() => {
    const q = searchParams.get("search") || "";
    const cat = searchParams.get("category_id") || "all";
    const sort = searchParams.get("sort") || "newest";
    const chef = (searchParams.get("chef") || "0") === "1";
    const page = Number(searchParams.get("page") || "1") || 1;

    return {
      appliedSearch: q,
      inputSearch: q,
      categoryId: cat,
      sort: sort === "popularity" ? "popularity" : "newest",
      onlyChef: chef,
      page,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUrl = useCallback(
    (next, { replace = true, debounceMs = 80 } = {}) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);

          const search = next.search ?? "";
          const category_id = next.category_id ?? "all";
          const sort = next.sort ?? "newest";
          const chef = next.chef ?? "0";
          const page = next.page ?? "1";

          if (search) p.set("search", search);
          else p.delete("search");

          if (category_id !== "all") p.set("category_id", category_id);
          else p.delete("category_id");

          if (sort !== "newest") p.set("sort", sort);
          else p.delete("sort");

          if (chef === "1") p.set("chef", "1");
          else p.delete("chef");

          p.set("page", String(page));
          return p;
        }, { replace });
      }, debounceMs);
    },
    [setSearchParams]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { readInitial, syncUrl };
}
