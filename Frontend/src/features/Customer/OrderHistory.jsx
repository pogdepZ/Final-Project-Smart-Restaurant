import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../../services/orderApi";
import OrderDetailModal from "./popup/OrderDetailModal";
import { formatMoneyVND } from "../../utils/orders";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // modal state
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await orderApi.getMyOrders({ page, limit: 10 });
        if (!mounted) return;

        setOrders(res?.data || []);
        setHasMore(res?.meta?.hasMore || false);
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.message || "Không tải được lịch sử đơn hàng",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [page]);

  const openModal = async (orderId) => {
    setOpenDetail(true);
    setDetailLoading(true);
    setDetailOrder(null);

    try {
      const res = await orderApi.getMyOrderDetail(orderId);
      setDetailOrder(res);
    } catch (e) {
      // nếu lỗi, vẫn mở modal nhưng show “Không có dữ liệu”
      setDetailOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Lịch sử đơn hàng</h1>
        <Link
          to="/profile"
          className="text-xs text-orange-400 font-bold hover:underline"
        >
          Quay lại Profile
        </Link>
      </div>

      {loading ? (
        <p className="text-white/50">Đang tải...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-white/50">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">
                    Bàn: {o.table_number || "—"}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(o.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase font-black text-orange-400">
                    {o.status}
                  </p>
                  <p className="font-black">
                    {formatMoneyVND(Number(o.total_amount || 0))}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {(o.items || []).slice(0, 3).map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between text-sm text-white/80"
                  >
                    <span className="truncate max-w-[70%]">
                      {it.quantity}x {it.item_name}
                    </span>
                    <span className="text-xs uppercase text-white/50">
                      {it.uiStatus || it.status}
                    </span>
                  </div>
                ))}
                {(o.items || []).length > 3 ? (
                  <p className="text-xs text-white/40">
                    + {o.items.length - 3} món nữa
                  </p>
                ) : null}
              </div>

              <div className="mt-3 flex justify-end gap-3">
                {/* 1) Modal quick view */}
                <button
                  onClick={() => openModal(o.id)}
                  className="text-xs font-black px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Xem nhanh
                </button>

                {/* 2) Detail page */}
                <Link
                  to={`/orders/${o.id}`}
                  className="text-xs font-black px-3 py-2 rounded-lg bg-orange-500 text-white hover:opacity-95"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40"
        >
          Trang trước
        </button>

        <span className="text-xs text-white/50">Trang {page}</span>

        <button
          disabled={!hasMore}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40"
        >
          Trang sau
        </button>
      </div>

      <OrderDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        order={detailOrder}
        loading={detailLoading}
      />
    </div>
  );
};

export default OrderHistory;
