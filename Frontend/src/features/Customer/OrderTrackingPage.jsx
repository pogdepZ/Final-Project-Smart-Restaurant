import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChefHat,
  AlertCircle,
  Bell,
} from "lucide-react";
import { toast } from "react-toastify";
import { orderApi } from "../../services/orderApi";
import useCustomerSocket from "../../hooks/useCustomerSocket";
import OrderItemStatus from "../../Components/customer/OrderItemStatus";
import { formatMoneyVND } from "../../utils/orders";

// Map status từ backend sang UI status
const mapItemStatus = (status) => {
  switch (status) {
    case "served":
    case "ready":
      return "Ready";
    case "rejected":
      return "Rejected";
    case "preparing":
      return "Cooking";
    default:
      return "Queued";
  }
};

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  // Sử dụng hook chung - socket events đã được xử lý ở CustomerLayout
  const { isConnected, lastUpdate } = useCustomerSocket(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null); // <-- ĐỔI: Chỉ lưu ID
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

      console.log("Fetched orders:", response);

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
          image: item.image_url || "",
        })),
      }));

      setOrders(mappedOrders);

      // Auto-select đơn hàng đang active
      if (!selectedOrderId) {
        const activeOrder = mappedOrders.find((o) => ![].includes(o.status));
        if (activeOrder) {
          setSelectedOrderId(activeOrder.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(err?.response?.data?.message || "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [qrToken, selectedOrderId]);

  // TÍNH TOÁN selectedOrder từ orders dựa trên selectedOrderId
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Lắng nghe lastUpdate từ socket để refresh data
  useEffect(() => {
    if (
      lastUpdate &&
      (lastUpdate.type === "order_status" ||
        lastUpdate.type === "order_item_status" ||
        lastUpdate.type === "bill_update")
    ) {
      // Fetch lại data khi có cập nhật từ socket
      fetchOrders();
    }
  }, [lastUpdate, fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusSummary = (order) => {
    if (!order)
      return { ready: 0, cooking: 0, queued: 0, rejected: 0, total: 0 };

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
        <h2 className="text-xl font-bold text-white mb-2">
          Chưa có thông tin bàn
        </h2>
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
  const allReady =
    summary.ready === summary.total - summary.rejected && summary.total > 0;

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

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">
              Theo dõi đơn hàng
            </h1>
            {isConnected && (
              <span
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                title="Kết nối thời gian thực"
              />
            )}
          </div>

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
                onClick={() => setSelectedOrderId(order.id)} // <-- ĐỔI: set ID thay vì object
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedOrderId === order.id
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
                  <p className="font-semibold text-white">
                    {selectedOrder.code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Bàn số</p>
                  <p className="font-semibold text-white">
                    {selectedOrder.tableNumber}
                  </p>
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
                      Đang chuẩn bị ({summary.ready}/
                      {summary.total - summary.rejected} món)
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
                <p className="text-2xl font-bold text-gray-400">
                  {summary.queued}
                </p>
                <p className="text-xs text-gray-500">Đang chờ</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {summary.cooking}
                </p>
                <p className="text-xs text-orange-400">Đang nấu</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-500">
                  {summary.ready}
                </p>
                <p className="text-xs text-green-400">Sẵn sàng</p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                Chi tiết món ({selectedOrder.items.length} món)
              </h2>
              <div className="space-y-3">
                {selectedOrder.items
                  .slice()
                  .sort((a, b) => {
                    // Thứ tự ưu tiên: Ready > Cooking > Queued > Rejected
                    const statusOrder = {
                      Ready: 1,
                      Cooking: 2,
                      Queued: 3,
                      Rejected: 4,
                    };
                    return (
                      (statusOrder[a.status] || 5) -
                      (statusOrder[b.status] || 5)
                    );
                  })
                  .map((item) => (
                    <OrderItemStatus key={item.id} item={item} />
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Auto-refresh notice */}
        <p className="text-center text-xs text-gray-500">
          {isConnected ? "🔗 Kết nối thời gian thực" : "⚠️ Kết nối bị mất"}
        </p>
      </main>
    </div>
  );
};

export default OrderTrackingPage;
