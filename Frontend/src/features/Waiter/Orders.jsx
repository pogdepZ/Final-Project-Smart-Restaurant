import React, { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Receipt, Search, RefreshCw, Filter, User, MapPin } from "lucide-react";
import axiosClient from "../../store/axiosClient";
import { useSocket } from "../../context/SocketContext";

// Import Components
import OrderCard from "../../Components/OrderCard";
import OrderDetailModal from "../../Components/OrderDetailModal";

export default function WaiterOrdersPage() {
  const socket = useSocket();

  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'my-tables'
  const [myTables, setMyTables] = useState([]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mặc định hiển thị tab "received" (Pending)
  const [statusFilter, setStatusFilter] = useState("received");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchMyTables = async () => {
    try {
      const res = await axiosClient.get("/tables/my-tables");
      setMyTables(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Gọi khi chuyển tab
  useEffect(() => {
    if (activeTab === "my-tables") {
      fetchMyTables();
    }
  }, [activeTab]);

  // 1. Fetch Orders từ API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Gọi API lấy tất cả đơn để client tự filter tab cho mượt
      // Hoặc gọi /orders?status=received nếu muốn tối ưu
      const res = await axiosClient.get("/orders");
      setOrders(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Lắng nghe Socket Real-time
  useEffect(() => {
    if (!socket) return;

    // Khi có khách đặt món mới -> Thêm vào list Pending
    const handleNewOrder = (newOrder) => {
      setOrders((prev) => {
        // Tránh trùng lặp
        if (prev.find((o) => o.id === newOrder.id)) return prev;
        console.log("New order received via socket:", newOrder);
        return [newOrder, ...prev]; // Thêm lên đầu
      });
      toast.info(`🔔 Đơn mới: Bàn ${newOrder.table_number || "Mang về"}`);
    };

    // Khi trạng thái thay đổi (Bếp làm xong, hoặc Waiter khác accept) -> Update list
    const handleUpdateOrder = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );

      if (updatedOrder.status === "ready") {
        toast.success(`✅ Món bàn ${updatedOrder.table_number} đã xong!`);
      }
    };

    socket.on("new_order", handleNewOrder);
    socket.on("update_order", handleUpdateOrder);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("update_order", handleUpdateOrder);
    };
  }, [socket]);

  // 3. Logic Lọc & Tìm kiếm Client-side
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      // Filter theo Tab (Status)
      const matchStatus =
        statusFilter === "all" ? true : o.status === statusFilter;

      // Filter theo Search text
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.table_number || "").toLowerCase().includes(q) ||
        (o.items || []).some((it) => it.name.toLowerCase().includes(q));

      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  // 4. Actions (Chấp nhận / Từ chối)
  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axiosClient.patch(`/orders/${orderId}`, { status });
      toast.success(
        status === "preparing" ? "Đã nhận đơn & Chuyển bếp" : "Đã cập nhật"
      );
      // Socket sẽ trả về update_order để update UI, nhưng ta update luôn cho nhanh
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (e) {
      toast.error("Lỗi cập nhật");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
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
              <h1 className="text-2xl md:text-3xl font-black mt-3 text-white">
                Quản lý Đơn Hàng
              </h1>
            </div>

            <button
              onClick={fetchOrders}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all inline-flex items-center gap-2"
            >
              <RefreshCw size={18} /> Làm mới
            </button>
          </div>

          {/* Controls Bar */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã đơn, số bàn, tên món..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Filter Tabs (Dropdown style) */}
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-200 outline-none cursor-pointer [&>option]:bg-neutral-900"
              >
                <option value="received">
                  ⏳ Chờ xử lý (
                  {orders.filter((o) => o.status === "received").length})
                </option>
                <option value="preparing">
                  🔥 Đang nấu (
                  {orders.filter((o) => o.status === "preparing").length})
                </option>
                <option value="ready">
                  ✅ Sẵn sàng (
                  {orders.filter((o) => o.status === "ready").length})
                </option>
                <option value="completed">💰 Đã xong</option>
                <option value="cancelled">❌ Đã hủy</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>

          {/* Tab Buttons */}
          {/* TABS NAVIGATION (MỚI) */}
          <div className="flex gap-6 mt-6 border-b border-white/5">
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === "orders"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Đơn Hàng
            </button>
            <button
              onClick={() => setActiveTab("my-tables")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === "my-tables"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Bàn Của Tôi ({myTables.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24">
        {activeTab === "orders" && loading ? (
          <div className="text-center py-20 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-gray-400">
              Không tìm thấy đơn hàng nào ở trạng thái này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={() => setSelectedOrder(order)}
                // Nút Chấp nhận chỉ hiện khi status = received
                onAccept={() => handleUpdateStatus(order.id, "preparing")}
                // Nút Từ chối
                onReject={() => handleUpdateStatus(order.id, "cancelled")}
              />
            ))}
          </div>
        )}
      </div>

      {/* VIEW 2: MY TABLES (MỚI) */}
      {activeTab === "my-tables" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {myTables.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">
              Bạn chưa được phân công bàn nào.
            </div>
          ) : (
            myTables.map((table) => (
              <div
                key={table.id}
                className="bg-neutral-900 border border-white/10 p-5 rounded-xl shadow-lg relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl font-black text-white">
                    {table.table_number}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${
                      table.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                  <MapPin size={14} className="text-orange-500" />{" "}
                  {table.location}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <User size={14} className="text-orange-500" />{" "}
                  {table.capacity} Khách
                </div>

                {/* Nút Xem đơn của bàn này (Optional) */}
                <button
                  onClick={() => {
                    setSearch(table.table_number); // Filter orders tab theo bàn này
                    setActiveTab("orders");
                  }}
                  className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all"
                >
                  Xem đơn bàn này
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal chi tiết */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAccept={() => {
            handleUpdateStatus(selectedOrder.id, "preparing");
            setSelectedOrder(null);
          }}
          onReject={() => {
            handleUpdateStatus(selectedOrder.id, "cancelled");
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}
