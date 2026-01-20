import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { orderApi } from "../../services/orderApi";
import { formatMoneyVND } from "../../utils/orders";

const badge = (uiStatus) => {
  if (uiStatus === "Ready")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
  if (uiStatus === "Cooking")
    return "bg-orange-500/15 text-orange-300 border-orange-500/25";
  if (uiStatus === "Rejected")
    return "bg-red-500/15 text-red-300 border-red-500/25";
  return "bg-white/5 text-white/70 border-white/10";
};

const OrderDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await orderApi.getMyOrderDetail(id);
        if (!mounted) return;
        setOrder(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || t("order.detail.loadFailed"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">{t("order.detail.title")}</h1>
        <Link
          to="/history"
          className="text-xs text-orange-400 font-bold hover:underline"
        >
          {t("order.detail.backToHistory")}
        </Link>
      </div>

      {loading ? (
        <p className="text-white/50">{t("order.detail.loading")}</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : !order ? (
        <p className="text-white/50">{t("order.detail.noData")}</p>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black">
                {t("order.detail.table")}: {order.table_number || "—"}
              </p>
              <p className="text-xs text-white/50">
                {new Date(order.created_at).toLocaleString("vi-VN")}
              </p>
              <p className="text-xs uppercase font-black text-orange-400 mt-1">
                {order.status} • {order.payment_status}
              </p>
            </div>
            <p className="font-black text-lg">
              {formatMoneyVND(Number(order.total_amount || 0))}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {(order.items || []).map((it) => (
              <div
                key={it.id}
                className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
              >
                {/* IMAGE */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                  {it.image_url ? (
                    <img
                      src={it.image_url}
                      alt={it.item_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                      —
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                  {/* LEFT */}
                  <div className="min-w-0">
                    <p className="font-bold truncate">
                      {it.quantity}x {it.item_name}
                    </p>

                    {it.note && (
                      <p className="text-xs text-white/50 mt-0.5">
                        {t("order.detail.orderNote")}: {it.note}
                      </p>
                    )}

                    <p className="text-xs text-white/50 mt-1">
                      {formatMoneyVND(Number(it.subtotal || 0))}
                    </p>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right shrink-0">
                    <span
                      className={[
                        "inline-flex items-center px-2 py-1 rounded-lg border text-[11px] font-black uppercase",
                        badge(it.uiStatus),
                      ].join(" ")}
                    >
                      {it.uiStatus}
                    </span>
                    <p className="text-xs text-white/50 mt-1">{it.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {order.note ? (
            <div className="mt-4 text-sm text-white/70">
              <span className="text-white/50">{t("order.detail.note")}:</span>{" "}
              {order.note}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
