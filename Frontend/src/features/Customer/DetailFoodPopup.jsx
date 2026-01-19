// src/pages/Menu/DetailFoodPopup.jsx (hoặc đúng path của bạn)
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  X,
  Star,
  Send,
  MessageSquare,
  Flame,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { menuApi } from "../../services/menuApi";
import { formatMoneyVND } from "../../utils/orders";

const REVIEWS_PAGE_SIZE = 5;

function StarsRow({ rating = 0, size = 10 }) {
  return (
    <div className="flex text-yellow-600 mb-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            fill={filled ? "currentColor" : "none"}
            className={filled ? "" : "opacity-40"}
          />
        );
      })}
    </div>
  );
}

function statusLabel(status) {
  if (!status || status === "available")
    return {
      text: "Available",
      cls: "bg-green-500/15 text-green-300 border-green-500/25",
    };
  if (status === "unavailable")
    return {
      text: "Unavailable",
      cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    };
  if (status === "sold_out")
    return {
      text: "Sold out",
      cls: "bg-red-500/15 text-red-300 border-red-500/25",
    };
  return {
    text: String(status),
    cls: "bg-white/10 text-gray-200 border-white/10",
  };
}

function unwrapList(res) {
  const data = res?.data ?? res?.items ?? res?.data?.data ?? [];
  const meta = res?.meta ?? res?.data?.meta ?? null;
  return { data, meta };
}

export default function FoodDetailPopup({
  food,
  onClose,
  onSelectFood,
  onConfirm,
  mode = "add",
  initial = null,
}) {
  const aliveRef = useRef(true);

  // lock body scroll
  useEffect(() => {
    aliveRef.current = true;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      aliveRef.current = false;
      document.body.style.overflow = prev;
    };
  }, []);

  // close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ===== detail(modifiers) =====
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  // selection state
  const [singlePick, setSinglePick] = useState({}); // { [groupId]: optionId }
  const [multiPick, setMultiPick] = useState({}); // { [groupId]: Set<optionId> }
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  // ===== reviews =====
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  // ===== related =====
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const foodId = food?.id;

  const canOrder = useMemo(
    () => !food?.status || food?.status === "available",
    [food?.status],
  );
  const canReview = useMemo(
    () => !food?.status || food?.status === "available",
    [food?.status],
  );
  const statusMeta = useMemo(() => statusLabel(food?.status), [food?.status]);

  const heroImage = useMemo(() => {
    return (
      food?.image ||
      food?.image_url ||
      "https://via.placeholder.com/900x900?text=No+Image"
    );
  }, [food]);

  // reset when food changes
  useEffect(() => {
    if (!foodId) return;

    setDetail(null);
    setDetailError("");
    setSinglePick({});
    setMultiPick({});
    setNote("");
    setQty(1);

    setReviews([]);
    setReviewsPage(1);
    setReviewsHasMore(true);
    setReviewsError("");

    setRelated([]);
  }, [foodId]);

  // ===== load detail =====
  useEffect(() => {
    if (!foodId) return;
    let abort = false;

    const run = async () => {
      setLoadingDetail(true);
      setDetailError("");

      try {
        const res = await menuApi.getMenuItemById(foodId);
        const item = res?.data ?? res ?? null;
        if (!aliveRef.current || abort) return;

        const normalized = {
          ...food,
          ...item,
          image: item?.image_url ?? food?.image ?? food?.image_url,
          modifier_groups: item?.modifier_groups ?? [],
        };

        setDetail(normalized);

        if (initial) {
          setQty(Number(initial.quantity) > 0 ? Number(initial.quantity) : 1);
          setNote(initial.note || "");

          const initMods = initial.modifiers || [];
          const nextSingle = {};
          const nextMulti = {};

          // initMods: [{ option_id, group_id?, group_name?, name, price }]
          // nếu bạn không có group_id trong modifier, ta match bằng option_id lookup
          initMods.forEach((m) => {
            const optId = m.option_id || m.id || m.modifier_option_id;
            if (!optId) return;

            // tìm group của optionId
            const found = (normalized.modifier_groups || [])
              .map((g) => ({
                g,
                opt: (g.options || []).find((o) => o.id === optId),
              }))
              .find((x) => x.opt);

            if (!found) return;

            const g = found.g;
            if (g.selection_type === "single") {
              nextSingle[g.id] = optId;
            } else {
              if (!nextMulti[g.id]) nextMulti[g.id] = new Set();
              nextMulti[g.id].add(optId);
            }
          });

          setSinglePick((prev) => ({ ...prev, ...nextSingle }));
          setMultiPick((prev) => {
            const merged = { ...prev };
            Object.entries(nextMulti).forEach(([gid, setVal]) => {
              merged[gid] = new Set(setVal);
            });
            return merged;
          });
        }

        // auto preselect required single groups if only 1 option
        const groups = normalized.modifier_groups || [];
        const nextSingle = {};
        groups.forEach((g) => {
          if (g.selection_type === "single" && g.is_required) {
            const opts = g.options || [];
            if (opts.length === 1) nextSingle[g.id] = opts[0].id;
          }
        });
        setSinglePick(nextSingle);
      } catch (e) {
        if (!aliveRef.current || abort) return;
        setDetailError(e?.message || "Load item detail failed");
      } finally {
        if (!aliveRef.current || abort) return;
        setLoadingDetail(false);
      }
    };

    run();
    return () => {
      abort = true;
    };
  }, [foodId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== load reviews page 1 =====
  useEffect(() => {
    if (!foodId) return;
    let abort = false;

    const run = async () => {
      setLoadingReviews(true);
      setReviewsError("");

      try {
        const res = await menuApi.getItemReviews(foodId, {
          page: 1,
          limit: REVIEWS_PAGE_SIZE,
        });
        const { data, meta } = unwrapList(res);
        if (!aliveRef.current || abort) return;

        setReviews(data);

        const hasMore =
          meta && typeof meta.hasMore === "boolean"
            ? meta.hasMore
            : (data?.length || 0) === REVIEWS_PAGE_SIZE;

        setReviewsHasMore(hasMore);
        setReviewsPage(1);
      } catch (e) {
        if (!aliveRef.current || abort) return;
        setReviewsError(e?.message || "Load reviews failed");
        setReviewsHasMore(false);
      } finally {
        if (!aliveRef.current || abort) return;
        setLoadingReviews(false);
      }
    };

    run();
    return () => {
      abort = true;
    };
  }, [foodId]);

  const loadMoreReviews = useCallback(async () => {
    if (!foodId || loadingReviews || !reviewsHasMore) return;

    const nextPage = reviewsPage + 1;
    setLoadingReviews(true);
    setReviewsError("");

    try {
      const res = await menuApi.getItemReviews(foodId, {
        page: nextPage,
        limit: REVIEWS_PAGE_SIZE,
      });
      const { data, meta } = unwrapList(res);
      if (!aliveRef.current) return;

      setReviews((prev) => prev.concat(data));

      const hasMore =
        meta && typeof meta.hasMore === "boolean"
          ? meta.hasMore
          : (data?.length || 0) === REVIEWS_PAGE_SIZE;

      setReviewsHasMore(hasMore);
      setReviewsPage(nextPage);
    } catch (e) {
      if (!aliveRef.current) return;
      setReviewsError(e?.message || "Load reviews failed");
      setReviewsHasMore(false);
    } finally {
      if (!aliveRef.current) return;
      setLoadingReviews(false);
    }
  }, [foodId, loadingReviews, reviewsHasMore, reviewsPage]);

  // ===== load related =====
  useEffect(() => {
    if (!foodId) return;
    let abort = false;

    const run = async () => {
      setLoadingRelated(true);
      try {
        const res = await menuApi.getRelatedMenuItems(foodId);
        const data = res?.data ?? res ?? [];
        if (!aliveRef.current || abort) return;

        const normalized = (data || []).map((it) => ({
          ...it,
          image: it.image_url ?? it.image,
        }));

        setRelated(normalized);
      } catch {
        // ignore
      } finally {
        if (!aliveRef.current || abort) return;
        setLoadingRelated(false);
      }
    };

    run();
    return () => {
      abort = true;
    };
  }, [foodId]);

  useEffect(() => {
    if (!detail?.modifier_groups?.length) return;
    if (!initial) return;

    const nextSingle = {};
    const nextMulti = {};

    setQty(Number(initial.quantity) > 0 ? Number(initial.quantity) : 1);
    setNote(initial.note || "");

    const initMods = Array.isArray(initial.modifiers) ? initial.modifiers : [];

    initMods.forEach((m) => {
      const optId =
        m.option_id || m.id || m.modifier_option_id || m.modifierOptionId;

      if (!optId) return;

      const group = detail.modifier_groups.find((g) =>
        (g.options || []).some((o) => o.id === optId),
      );

      if (!group) return;

      if (group.selection_type === "single") {
        nextSingle[group.id] = optId;
      } else {
        if (!nextMulti[group.id]) nextMulti[group.id] = new Set();
        nextMulti[group.id].add(optId);
      }
    });

    // ✅ SET MỚI HOÀN TOÀN
    setSinglePick(nextSingle);
    setMultiPick(nextMulti);
  }, [detail?.id, initial]);

  // ===== rating meta =====
  const avgRating = useMemo(() => {
    const fromFood =
      detail?.avg_rating ?? detail?.rating ?? food?.avg_rating ?? food?.rating;
    if (typeof fromFood === "number") return fromFood;
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [detail, food, reviews]);

  const totalReviews = useMemo(() => {
    const fromFood =
      detail?.reviews_count ??
      detail?.total_reviews ??
      food?.reviews_count ??
      food?.total_reviews;
    if (typeof fromFood === "number") return fromFood;
    return reviews?.length || 0;
  }, [detail, food, reviews?.length]);

  // ===== modifiers helpers =====
  const groups = detail?.modifier_groups || [];

  const optionById = useMemo(() => {
    const map = new Map();
    groups.forEach((g) =>
      (g.options || []).forEach((o) => map.set(o.id, { ...o, group: g })),
    );
    return map;
  }, [groups]);

  const selectedModifiers = useMemo(() => {
    const out = [];

    // single
    Object.entries(singlePick).forEach(([groupId, optionId]) => {
      const opt = optionById.get(optionId);
      const group = groups.find((g) => g.id === groupId);
      if (opt && group) {
        out.push({
          group_id: groupId,
          group_name: group.name,
          option_id: opt.id,
          name: opt.name,
          price: Number(opt.price ?? opt.price_adjustment ?? 0),
        });
      }
    });

    // multiple
    Object.entries(multiPick).forEach(([groupId, setVal]) => {
      const group = groups.find((g) => g.id === groupId);
      const ids = Array.isArray(setVal) ? setVal : Array.from(setVal || []);
      ids.forEach((optionId) => {
        const opt = optionById.get(optionId);
        if (opt && group) {
          out.push({
            group_id: groupId,
            group_name: group.name,
            option_id: opt.id,
            name: opt.name,
            price: Number(opt.price ?? opt.price_adjustment ?? 0),
          });
        }
      });
    });

    return out;
  }, [singlePick, multiPick, optionById, groups]);

  const extraPrice = useMemo(
    () => selectedModifiers.reduce((s, m) => s + Number(m.price || 0), 0),
    [selectedModifiers],
  );

  const unitPrice = useMemo(
    () => Number(detail?.price ?? food?.price ?? 0) + extraPrice,
    [detail?.price, food?.price, extraPrice],
  );

  const totalPrice = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  const validateSelections = useCallback(() => {
    for (const g of groups) {
      const isReq = !!g.is_required;
      const type = g.selection_type;

      if (type === "single") {
        if (isReq && !singlePick[g.id]) return `Vui lòng chọn ${g.name}.`;
      } else if (type === "multiple") {
        const picked = multiPick[g.id];
        const count = picked
          ? Array.isArray(picked)
            ? picked.length
            : picked.size
          : 0;

        const min = Number(g.min_selections ?? 0);
        const max = Number(g.max_selections ?? 0);

        if (isReq && min <= 0 && count === 0) return `Vui lòng chọn ${g.name}.`;
        if (min > 0 && count < min) return `Chọn ít nhất ${min} cho ${g.name}.`;
        if (max > 0 && count > max)
          return `Chọn tối đa ${max} lựa chọn cho ${g.name}.`;
      }
    }
    return "";
  }, [groups, singlePick, multiPick]);

  const toggleMulti = (groupId, optionId, maxSelections = 0) => {
    setMultiPick((prev) => {
      const next = { ...prev };
      const curSet = new Set(prev[groupId] ? Array.from(prev[groupId]) : []);

      if (curSet.has(optionId)) curSet.delete(optionId);
      else {
        if (maxSelections > 0 && curSet.size >= maxSelections) {
          toast.info(`Chỉ được chọn tối đa ${maxSelections} lựa chọn.`);
          return prev;
        }
        curSet.add(optionId);
      }

      next[groupId] = curSet;
      return next;
    });
  };

  const handleSubmitReview = async () => {
    if (!foodId) return;
    if (!userRating) return toast.error("Vui lòng chọn số sao trước nhé!");
    if (!comment.trim()) return toast.error("Bạn chưa nhập nhận xét.");
    if (!canReview)
      return toast.error("Món này hiện không khả dụng để đánh giá.");

    try {
      await menuApi.createReview({
        menu_item_id: foodId,
        rating: userRating,
        comment: comment.trim(),
      });
      toast.success("Cảm ơn bạn đã đánh giá!");
      setUserRating(0);
      setComment("");

      const res = await menuApi.getItemReviews(foodId, {
        page: 1,
        limit: REVIEWS_PAGE_SIZE,
      });
      const { data, meta } = unwrapList(res);
      setReviews(data);
      setReviewsPage(1);
      setReviewsHasMore(
        meta && typeof meta.hasMore === "boolean"
          ? meta.hasMore
          : (data?.length || 0) === REVIEWS_PAGE_SIZE,
      );
    } catch (e) {
      toast.error(e?.response?.data?.message || "Gửi đánh giá thất bại");
    }
  };

  const handleConfirm = () => {
    if (!canOrder) return toast.warning("Món này hiện không khả dụng để đặt.");

    const err = validateSelections();
    if (err) return toast.error(err);

    if (!onConfirm) return toast.info("Bạn chưa truyền onConfirm vào popup.");

    onConfirm({
      id: foodId,
      name: detail?.name ?? food?.name ?? "",
      price: Number(detail?.price ?? food?.price ?? 0),
      image: detail?.image ?? heroImage,
      quantity: qty,
      note: note.trim(),
      modifiers: selectedModifiers.map((m) => ({
        option_id: m.option_id,
        name: m.name,
        price: m.price,
        group_name: m.group_name,
      })),
    });
  };

  if (!foodId) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-orange-500 text-white rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* LEFT */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          <img
            src={detail?.image ?? heroImage}
            alt={detail?.name ?? food?.name}
            className="w-full h-full object-cover"
          />

          <div className="absolute top-4 left-4 z-10">
            <span
              className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${statusMeta.cls}`}
            >
              {statusMeta.text}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-neutral-900 via-neutral-900/40 to-transparent">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              {detail?.name ?? food?.name}
            </h2>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-2xl font-black text-orange-500">
                {formatMoneyVND(Number(detail?.price ?? food?.price ?? 0))}
              </span>
              <div className="h-4 w-px bg-white/20 mx-2" />
              <div className="flex items-center text-yellow-500 gap-1 text-sm">
                <Star size={14} fill="currentColor" />
                {avgRating ? `${avgRating}` : "0.0"} ({totalReviews}+)
              </div>

              {(detail?.is_chef_recommended ?? food?.is_chef_recommended) && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-orange-400">
                  <Flame
                    size={14}
                    className="fill-orange-500 text-orange-500"
                  />{" "}
                  Chef’s pick
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-1/2 flex flex-col bg-neutral-900 p-6 md:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* description */}
            <section>
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold mb-2">
                Mô tả món ăn
              </h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {detail?.description ?? food?.description}
              </p>
            </section>

            {/* ===== modifiers UI ===== */}
            <section className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold">
                Tuỳ chọn
              </h4>

              {loadingDetail ? (
                <div className="text-xs text-gray-500">
                  Đang tải tuỳ chọn...
                </div>
              ) : detailError ? (
                <div className="text-xs text-red-300">Lỗi: {detailError}</div>
              ) : groups.length ? (
                <div className="space-y-4">
                  {groups.map((g) => {
                    const req = g.is_required ? " *" : "";
                    const max = Number(g.max_selections ?? 0);

                    return (
                      <div
                        key={g.id}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-extrabold text-white">
                              {g.name}
                              <span className="text-orange-400">{req}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              {g.selection_type === "single"
                                ? "Chọn 1"
                                : max > 0
                                  ? `Chọn tối đa ${max}`
                                  : "Chọn nhiều"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {(g.options || []).map((o) => {
                            const price = Number(
                              o.price ?? o.price_adjustment ?? 0,
                            );
                            const isSingle = g.selection_type === "single";
                            const isPicked = isSingle
                              ? singlePick[g.id] === o.id
                              : multiPick[g.id]
                                ? Array.from(multiPick[g.id]).includes(o.id)
                                : false;

                            const onPick = () => {
                              if (isSingle) {
                                setSinglePick((prev) => ({
                                  ...prev,
                                  [g.id]: o.id,
                                }));
                              } else {
                                toggleMulti(g.id, o.id, max);
                              }
                            };

                            return (
                              <button
                                type="button"
                                key={o.id}
                                onClick={onPick}
                                className={`text-left p-3 rounded-xl border transition-all ${
                                  isPicked
                                    ? "bg-orange-500/20 border-orange-500/40"
                                    : "bg-neutral-900/30 border-white/10 hover:border-orange-500/30"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-bold text-white line-clamp-1">
                                    {o.name}
                                  </div>
                                  {isPicked ? (
                                    <Check
                                      size={14}
                                      className="text-orange-400"
                                    />
                                  ) : null}
                                </div>
                                <div className="text-[11px] mt-1 font-extrabold text-orange-300">
                                  {price > 0
                                    ? `+ ${formatMoneyVND(price)}`
                                    : "+ 0₫"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Món này không có tuỳ chọn.
                </div>
              )}
            </section>

            {/* note + qty + confirm */}
            <section className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold">
                Ghi chú & Số lượng
              </h4>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: ít cay, không hành..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-20 resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-neutral-800 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full bg-neutral-700 hover:bg-orange-500 text-white flex items-center justify-center transition-all active:scale-90"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-extrabold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    Đơn giá (gồm option)
                  </div>
                  <div className="text-xl font-black text-orange-500">
                    {formatMoneyVND(unitPrice)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canOrder}
                className="w-full mt-2 px-5 py-4 rounded-2xl font-black text-white bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {mode === "edit" ? "Cập nhật" : "Thêm vào giỏ"} •{" "}
                {formatMoneyVND(totalPrice)}
              </button>
            </section>

            {/* related */}
            <section className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold">
                Gợi ý món liên quan
              </h4>

              {loadingRelated ? (
                <div className="text-xs text-gray-500">Đang tải gợi ý...</div>
              ) : related.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {related.slice(0, 4).map((it) => (
                    <button
                      type="button"
                      key={it.id}
                      onClick={() => onSelectFood?.(it.id)} // ✅ QUAN TRỌNG: gọi lên Menu đổi món
                      className="text-left bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-orange-500/30 transition-all"
                      title={it.name}
                    >
                      <div className="h-20 bg-white/5">
                        <img
                          src={
                            it.image ||
                            "https://via.placeholder.com/400x400?text=No+Image"
                          }
                          alt={it.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {it.name}
                        </div>
                        <div className="text-[11px] text-orange-400 font-extrabold mt-1">
                          {formatMoneyVND(Number(it.price || 0))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">Chưa có gợi ý.</div>
              )}
            </section>

            {/* reviews */}
            <section className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold flex items-center gap-2">
                <MessageSquare size={14} /> Khách hàng nói gì
              </h4>

              <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {loadingReviews && reviews.length === 0 ? (
                  <div className="text-xs text-gray-500">
                    Đang tải đánh giá...
                  </div>
                ) : reviewsError && reviews.length === 0 ? (
                  <div className="text-xs text-red-300">
                    Lỗi: {reviewsError}
                  </div>
                ) : reviews.length ? (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white/5 p-3 rounded-xl border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-white">
                          {rev.user_name || "Ẩn danh"}
                        </span>
                        <span className="text-[10px] text-gray-500 italic">
                          {rev.created_at || ""}
                        </span>
                      </div>
                      <StarsRow rating={Number(rev.rating || 0)} size={10} />
                      <p className="text-xs text-gray-400">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">Chưa có đánh giá.</div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] text-gray-500">
                  {reviews.length ? `Đã tải ${reviews.length} đánh giá` : ""}
                </div>

                {reviewsHasMore ? (
                  <button
                    type="button"
                    onClick={loadMoreReviews}
                    disabled={loadingReviews}
                    className={`text-xs font-bold ${
                      loadingReviews
                        ? "text-gray-600"
                        : "text-orange-400 hover:underline"
                    }`}
                  >
                    {loadingReviews ? "Đang tải..." : "Xem thêm"}
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-600">
                    Hết đánh giá
                  </span>
                )}
              </div>
            </section>

            {/* review form */}
            <section className="pt-4 border-t border-white/10">
              <h4 className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-3">
                Đánh giá của bạn
              </h4>

              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setUserRating(s)}
                    disabled={!canReview}
                    className={`${
                      userRating >= s ? "text-orange-500" : "text-gray-600"
                    } hover:scale-110 transition-transform disabled:opacity-40`}
                  >
                    <Star
                      size={20}
                      fill={userRating >= s ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    canReview
                      ? "Chia sẻ cảm nhận của bạn..."
                      : "Món hiện không khả dụng để đánh giá."
                  }
                  disabled={!canReview}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-20 resize-none disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={!canReview}
                  className="absolute bottom-3 right-3 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
