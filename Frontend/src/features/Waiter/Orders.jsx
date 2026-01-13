import React, { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Receipt, Search, RefreshCw, Filter } from "lucide-react";
import axiosClient from "../../store/axiosClient"; // Import axios của bạn
import { useSocket } from "../../context/SocketContext";
import OrderCard from "../../Components/OrderCard";
import OrderDetailModal from "../../Components/OrderDetailModal";

export default function WaiterOrdersPage() {
  const socket = useSocket(); // <--- SỬ DỤNG HOOK

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mapping trạng thái UI với trạng thái DB
  // pending -> received
  // accepted -> preparing
  // rejected -> cancelled
  const [statusFilter, setStatusFilter] = useState("received");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 1. Fetch Orders ban đầu
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/orders");
      // Giả sử API trả về mảng, nếu trả về { data: [...] } thì sửa thành res.data
      setOrders(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error("Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Kiểm tra nếu socket chưa kết nối thì không làm gì cả
    if (!socket) return;

    // Lắng nghe sự kiện
    const handleNewOrder = (newOrder) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === newOrder.id)) return prev;
        toast.info(`🔔 Đơn mới: ${newOrder.table_number || "Mang về"}`);
        return [newOrder, ...prev];
      });
    };

    const handleUpdateOrder = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      if (updatedOrder.status === "ready") {
        toast.success(`✅ Bàn ${updatedOrder.table_number || ""} đã xong!`);
      }
    };

    socket.on("new_order", handleNewOrder);
    socket.on("update_order", handleUpdateOrder);

    // Cleanup listener khi component unmount HOẶC khi socket thay đổi
    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("update_order", handleUpdateOrder);
    };
  }, [socket]); // <--- THÊM SOCKET VÀO DEPENDENCY

  // Filter Logic
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      // Logic filter status
      // Nếu chọn "all" thì hiện hết, ngược lại phải khớp status
      const matchStatus =
        statusFilter === "all" ? true : o.status === statusFilter;

      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.table_number || "").toLowerCase().includes(q) || // table_number từ backend
        (o.items || []).some((it) => it.item_name.toLowerCase().includes(q)); // item_name từ backend

      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  // Actions
  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axiosClient.patch(`/orders/${orderId}`, { status });
      toast.success(
        status === "preparing" ? "Đã chuyển xuống bếp" : "Đã cập nhật"
      );
      // Không cần setOrders thủ công vì socket 'update_order' sẽ tự lo việc đó
    } catch (e) {
      toast.error("Lỗi cập nhật đơn hàng");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/95 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Receipt className="w-4 h-4 text-orange-500" />
                <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
                  Waiter Console
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black mt-3">
                Quản lý Đơn
              </h1>
            </div>

            <button
              onClick={fetchOrders}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all inline-flex items-center gap-2"
            >
              <RefreshCw size={18} /> Làm mới
            </button>
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm đơn..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-200 outline-none [&>option]:bg-neutral-900"
              >
                <option value="received">Chờ xử lý (Pending)</option>
                <option value="preparing">Đang nấu (In Kitchen)</option>
                <option value="ready">Sẵn sàng (Ready)</option>
                <option value="completed">Đã xong (Completed)</option>
                <option value="cancelled">Đã hủy</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Không có đơn hàng nào
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={() => setSelectedOrder(order)}
                // Khi Accept -> Chuyển trạng thái sang 'preparing' (cho bếp)
                onAccept={() => handleUpdateStatus(order.id, "preparing")}
                // Khi Reject -> Chuyển sang 'cancelled'
                onReject={() => handleUpdateStatus(order.id, "cancelled")}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAccept={() => handleUpdateStatus(selectedOrder.id, "preparing")}
          onReject={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
        />
      )}
    </div>
  );
}
