import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Star, Send, MessageSquare, Flame } from "lucide-react";
import { menuApi } from "../../services/menuApi"; // <-- chỉnh path cho đúng project bạn
import { toast } from "react-toastify";

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
  if (!status || status === "available") return { text: "Available", cls: "bg-green-500/15 text-green-300 border-green-500/25" };
  if (status === "unavailable") return { text: "Unavailable", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25" };
  if (status === "sold_out") return { text: "Sold out", cls: "bg-red-500/15 text-red-300 border-red-500/25" };
  return { text: String(status), cls: "bg-white/10 text-gray-200 border-white/10" };
}

const FoodDetailPopup = ({ food, onClose }) => {
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");

  // --- reviews state ---
  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  // --- related state ---
  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // avoid setting state after close/food change
  const aliveRef = useRef(true);

  const canReview = useMemo(() => {
    // tùy bạn: nếu muốn vẫn cho review khi soldout thì bỏ điều kiện này
    return !food?.status || food?.status === "available";
  }, [food?.status]);

  const statusMeta = useMemo(() => statusLabel(food?.status), [food?.status]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  console.log(related)
  // reset when open a different food
  useEffect(() => {
    if (!food?.id) return;

    // reset reviews
    setReviews([]);
    setReviewsPage(1);
    setReviewsHasMore(true);
    setReviewsError("");

    // reset related
    setRelated([]);
  }, [food?.id]);

  // load reviews page 1
  useEffect(() => {
    const run = async () => {
      if (!food?.id) return;
      setLoadingReviews(true);
      setReviewsError("");

      try {
        const res = await menuApi.getItemReviews(food.id, {
          page: 1,
          limit: REVIEWS_PAGE_SIZE,
        });

        // normalize response
        const data = res?.data ?? res?.items ?? res?.data?.data ?? [];
        const meta = res?.meta ?? res?.data?.meta;

        if (!aliveRef.current) return;

        setReviews(data);

        const hasMore =
          meta && typeof meta.hasMore === "boolean"
            ? meta.hasMore
            : (data?.length || 0) === REVIEWS_PAGE_SIZE;

        setReviewsHasMore(hasMore);
        setReviewsPage(1);
      } catch (e) {
        if (!aliveRef.current) return;
        setReviewsError(e?.message || "Load reviews failed");
        setReviewsHasMore(false);
      } finally {
        if (!aliveRef.current) return;
        setLoadingReviews(false);
      }
    };

    run();
  }, [food?.id]);

  const loadMoreReviews = async () => {
    if (!food?.id) return;
    if (loadingReviews) return;
    if (!reviewsHasMore) return;

    const nextPage = reviewsPage + 1;
    setLoadingReviews(true);
    setReviewsError("");

    try {
      const res = await menuApi.getItemReviews(food.id, {
        page: nextPage,
        limit: REVIEWS_PAGE_SIZE,
      });

      const data = res?.data ?? res?.items ?? res?.data?.data ?? [];
      const meta = res?.meta ?? res?.data?.meta;

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
  };

  // load related
  useEffect(() => {
    const run = async () => {
      if (!food?.id) return;
      setLoadingRelated(true);
      try {
        const res = await menuApi.getRelatedMenuItems(food.id);
        const data = res ?? res?.data ?? res?.items ?? res?.data?.data ?? [];
        if (!aliveRef.current) return;

        // bạn đã normalize image ở Menu.jsx, ở đây mình cũng normalize nhẹ
        const normalized = (data || []).map((it) => ({ ...it, image: it.image_url ?? it.image }));
        setRelated(normalized);
      } catch {
        // ignore related errors để không phá UI
      } finally {
        if (!aliveRef.current) return;
        setLoadingRelated(false);
      }
    };
    run();
  }, [food?.id]);

  const avgRating = useMemo(() => {
    // nếu backend trả avg_rating/total_reviews thì ưu tiên dùng
    const fromFood = food?.avg_rating ?? food?.rating;
    if (typeof fromFood === "number") return fromFood;

    // fallback: compute from loaded reviews
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [food?.avg_rating, food?.rating, reviews]);

  const totalReviews = useMemo(() => {
    const fromFood = food?.reviews_count ?? food?.total_reviews;
    if (typeof fromFood === "number") return fromFood;
    return reviews?.length || 0;
  }, [food?.reviews_count, food?.total_reviews, reviews?.length]);

  const handleSubmitReview = async () => {
    if (!food?.id) return;
    if (!userRating) {
      toast.error("Vui lòng chọn số sao trước nhé!");
      return;
    }
    if (!comment.trim()) {
      toast.error("Bạn chưa nhập nhận xét.");
      return;
    }
    if (!canReview) {
      toast.error("Món này hiện không khả dụng để đánh giá.");
      return;
    }

    try {
      await menuApi.createReview({
        menu_item_id: food.id,
        rating: userRating,
        comment: comment.trim(),
      });

      toast.success("Cảm ơn bạn đã đánh giá!");

      // reset form
      setUserRating(0);
      setComment("");

      // reload reviews page 1 (đơn giản & chắc chắn đúng)
      setReviews([]);
      setReviewsPage(1);
      setReviewsHasMore(true);
      setReviewsError("");

      const res = await menuApi.getItemReviews(food.id, {
        page: 1,
        limit: REVIEWS_PAGE_SIZE,
      });

      const data = res?.data ?? res?.items ?? res?.data?.data ?? [];
      const meta = res?.meta ?? res?.data?.meta;

      setReviews(data);

      const hasMore =
        meta && typeof meta.hasMore === "boolean"
          ? meta.hasMore
          : (data?.length || 0) === REVIEWS_PAGE_SIZE;

      setReviewsHasMore(hasMore);
    } catch (e) {
      toast.error(e?.message || "Gửi đánh giá thất bại");
    }
  };

  if (!food) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Main Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-orange-500 text-white rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* CỘT TRÁI: Hình ảnh & Thông tin cơ bản */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          <img src={food.image} alt={food.name} className="w-full h-full object-cover" />

          {/* status pill */}
          <div className="absolute top-4 left-4 z-10">
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${statusMeta.cls}`}>
              {statusMeta.text}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-neutral-900 via-neutral-900/40 to-transparent">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{food.name}</h2>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-black text-orange-500">${food.price}</span>
              <div className="h-4 w-px bg-white/20 mx-2"></div>

              <div className="flex items-center text-yellow-500 gap-1 text-sm">
                <Star size={14} fill="currentColor" />
                {avgRating ? `${avgRating}` : "0.0"} ({totalReviews}+ đánh giá)
              </div>

              {food.is_chef_recommended && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-orange-400">
                  <Flame size={14} className="fill-orange-500 text-orange-500" /> Chef’s pick
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Mô tả & Feedback */}
        <div className="w-full md:w-1/2 flex flex-col bg-neutral-900 p-6 md:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Mô tả */}
            <section>
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold mb-2">
                Mô tả món ăn
              </h4>
              <p className="text-gray-400 text-sm leading-relaxed">{food.description}</p>
            </section>

            {/* Related items */}
            <section className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold">
                Gợi ý món liên quan
              </h4>

              {loadingRelated ? (
                <div className="text-xs text-gray-500">Đang tải gợi ý...</div>
              ) : related.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {related.slice(0, 4).map((it) => (
                    <div
                      key={it.id}
                      className="bg-white/5 border border-white/5 rounded-xl overflow-hidden"
                      title={it.name}
                    >
                      <div className="h-20 bg-white/5">
                        <img
                          src={it.image || "https://via.placeholder.com/400x400?text=No+Image"}
                          alt={it.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-bold text-white line-clamp-1">{it.name}</div>
                        <div className="text-[11px] text-orange-400 font-extrabold mt-1">
                          ${Number(it.price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">Chưa có gợi ý.</div>
              )}
            </section>

            {/* Danh sách Feedback */}
            <section className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold flex items-center gap-2">
                <MessageSquare size={14} /> Khách hàng nói gì
              </h4>

              {/* list */}
              <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {loadingReviews && reviews.length === 0 ? (
                  <div className="text-xs text-gray-500">Đang tải đánh giá...</div>
                ) : reviewsError && reviews.length === 0 ? (
                  <div className="text-xs text-red-300">Lỗi: {reviewsError}</div>
                ) : reviews.length ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-white">
                          {rev.user_name || rev.user || "Ẩn danh"}
                        </span>
                        <span className="text-[10px] text-gray-500 italic">
                          {rev.created_at || rev.date || ""}
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

              {/* pagination */}
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-gray-500">
                  {reviews.length ? `Đã tải ${reviews.length} đánh giá` : ""}
                </div>

                {reviewsError && reviews.length > 0 ? (
                  <div className="text-[11px] text-red-300">Lỗi: {reviewsError}</div>
                ) : null}

                {reviewsHasMore ? (
                  <button
                    onClick={loadMoreReviews}
                    disabled={loadingReviews}
                    className={`text-xs font-bold ${
                      loadingReviews ? "text-gray-600" : "text-orange-400 hover:underline"
                    }`}
                  >
                    {loadingReviews ? "Đang tải..." : "Xem thêm"}
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-600">Hết đánh giá</span>
                )}
              </div>
            </section>

            {/* Form đánh giá của bạn */}
            <section className="pt-4 border-t border-white/10">
              <h4 className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-3">
                Đánh giá của bạn
              </h4>

              {/* Star Rating Selector */}
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setUserRating(s)}
                    disabled={!canReview}
                    className={`${userRating >= s ? "text-orange-500" : "text-gray-600"} hover:scale-110 transition-transform disabled:opacity-40 disabled:hover:scale-100`}
                  >
                    <Star size={20} fill={userRating >= s ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    canReview
                      ? "Chia sẻ cảm nhận của bạn về món ăn..."
                      : "Món hiện không khả dụng để đánh giá."
                  }
                  disabled={!canReview}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-20 resize-none disabled:opacity-50"
                />

                <button
                  onClick={handleSubmitReview}
                  disabled={!canReview}
                  className="absolute bottom-3 right-3 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:hover:bg-orange-500"
                  title={!canReview ? "Không thể gửi khi món không available" : "Gửi đánh giá"}
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
};

export default FoodDetailPopup;
