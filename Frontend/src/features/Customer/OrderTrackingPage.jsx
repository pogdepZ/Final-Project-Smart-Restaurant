import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, ChefHat, AlertCircle } from "lucide-react";
import { orderApi } from "../../services/orderApi";
import OrderItemStatus from "../../components/customer/OrderItemStatus";

// Map status từ backend sang UI status
const mapItemStatus = (status) => {
  switch (status) {
    case "pending":
      return "Queued";
    case "served":
    case "ready":
      return "Ready";
    case "rejected":
      return "Rejected";
    case "accepted":
      return "Cooking";
    default:
      return "Pending";
  }
};

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const qrToken = localStorage.getItem("qrToken");

  const fetchOrders = useCallback(async () => {
    if (!qrToken) {
      setError("Vui lòng quét mã QR trên bàn để xem đơn hàng");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const response = await orderApi.getOrdersByTable(qrToken);

      console.log("Raw Orders by table response:", response);

      // Map dữ liệu từ API
      const mappedOrders = (response || []).map((order) => ({
        id: order.id,
        code: order.code || `ORD-${order.id.slice(0, 8)}`,
        tableNumber: order.table_number || "—",
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        estimatedTime: 20,
        items: (order.items || []).map((item, index) => ({
          id: item.id || `item-${index}`,
          name: item.item_name || item.name,
          quantity: item.quantity || item.qty,
          status: mapItemStatus(item.status),
          image: item.image || "",
        })),
      }));

      setOrders(mappedOrders);

      console.log("Mapped Orders:", mappedOrders);

      // Auto-select đơn hàng đang active (không phải completed/cancelled)
      const activeOrder = mappedOrders.find(
        (o) => !["completed", "cancelled"].includes(o.status)
      );
      if (activeOrder && !selectedOrder) {
        setSelectedOrder(activeOrder);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(err?.response?.data?.message || "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [qrToken, selectedOrder]);

  useEffect(() => {
    fetchOrders();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusSummary = (order) => {
    if (!order) return { ready: 0, cooking: 0, queued: 0, rejected: 0, total: 0 };

    // Sửa lại các chuỗi string so sánh cho khớp với hàm mapItemStatus
    const ready = order.items.filter((i) => i.status === "Ready").length;
    const cooking = order.items.filter((i) => i.status === "Cooking").length;
    
    // SỬA Ở ĐÂY: Đổi "Queued" thành "Pending"
    const queued = order.items.filter((i) => i.status === "Queued").length; 
    
    // SỬA Ở ĐÂY: Đổi "Rejected" thành "Cancelled" (nếu bạn muốn đếm món hủy)
    const rejected = order.items.filter((i) => i.status === "Rejected").length;

    return { ready, cooking, queued, rejected, total: order.items.length };
  };

  // No QR Token
  if (!qrToken) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Chưa có thông tin bàn</h2>
        <p className="text-gray-400 text-center mb-6">
          Vui lòng quét mã QR trên bàn để xem đơn hàng của bạn
        </p>
        <Link
          to="/booking"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
        >
          Xem sơ đồ bàn
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-orange-500 hover:text-orange-400 font-medium"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // No orders
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <ChefHat size={40} className="text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Chưa có đơn hàng</h2>
        <p className="text-gray-400 text-center mb-6">
          Bạn chưa đặt món nào. Hãy khám phá thực đơn của chúng tôi!
        </p>
        <Link
          to="/menu"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
        >
          Xem thực đơn
        </Link>
      </div>
    );
  }

  const summary = getStatusSummary(selectedOrder);
  const allReady = summary.ready === summary.total - summary.rejected && summary.total > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-300" />
          </button>

          <h1 className="text-lg font-semibold text-white">Theo dõi đơn hàng</h1>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={20}
              className={`text-gray-300 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Order Tabs - nếu có nhiều đơn */}
        {orders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedOrder?.id === order.id
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {order.code}
              </button>
            ))}
          </div>
        )}

        {selectedOrder && (
          <>
            {/* Order Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Mã đơn hàng</p>
                  <p className="font-semibold text-white">{selectedOrder.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Bàn số</p>
                  <p className="font-semibold text-white">{selectedOrder.tableNumber}</p>
                </div>
              </div>

              {/* Overall Progress */}
              {allReady ? (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="text-green-500" size={24} />
                  <span className="font-medium text-green-400">
                    Tất cả món đã sẵn sàng!
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <Clock className="text-orange-500" size={24} />
                  <div>
                    <p className="font-medium text-orange-400">
                      Đang chuẩn bị ({summary.ready}/{summary.total - summary.rejected} món)
                    </p>
                    <p className="text-sm text-orange-300/70">
                      Dự kiến: ~{selectedOrder.estimatedTime} phút
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-400">{summary.queued}</p>
                <p className="text-xs text-gray-500">Đang chờ</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{summary.cooking}</p>
                <p className="text-xs text-orange-400">Đang nấu</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-500">{summary.ready}</p>
                <p className="text-xs text-green-400">Sẵn sàng</p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                Chi tiết món ({selectedOrder.items.length} món)
              </h2>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <OrderItemStatus key={item.id} item={item} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Auto-refresh notice */}
        <p className="text-center text-xs text-gray-500">
          Tự động cập nhật mỗi 30 giây
        </p>
      </main>
    </div>
  );
};

export default OrderTrackingPage;
