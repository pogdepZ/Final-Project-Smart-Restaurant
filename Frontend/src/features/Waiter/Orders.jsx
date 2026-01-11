import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Receipt, Search, RefreshCw, Filter } from "lucide-react";

import { useOrdersMock } from "../../hooks/useOrdersMock";
import { useOrderNotificationsMock } from "../../hooks/useOrderNotificationsMock";
import OrderCard from "..//../Components/OrderCard";
import OrderDetailModal from "../../Components/OrderDetailModal";

export default function WaiterOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("pending"); // pending | accepted | rejected | all
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const {
    orders,
    setOrders,
    isLoading,
    isRefreshing,
    error,
    refresh,
    accept,
    reject,
    knownIdsRef,
  } = useOrdersMock();

  // ✅ Thông báo tách riêng (mock)
  useOrderNotificationsMock({
    enabled: true,
    intervalMs: 5000,
    knownIdsRef,
    onNewOrders: (newOrders) => {
      setOrders((prev) => {
        const next = [...newOrders, ...prev];
        next.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return next;
      });
    },
    onJumpToPending: () => setStatusFilter("pending"),
  });

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" ? true : o.status === statusFilter;
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.tableNumber || "").toLowerCase().includes(q) ||
        o.items.some((it) => it.name.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  async function onAccept(orderId) {
    try {
      await accept(orderId);
      toast.success("Đã chấp nhận đơn.");
    } catch (e) {
      toast.error(e?.message || "Chấp nhận đơn thất bại.");
    }
  }

  async function onReject(orderId) {
    try {
      await reject(orderId);
      toast.info("Đã từ chối đơn.");
    } catch (e) {
      toast.error(e?.message || "Từ chối đơn thất bại.");
    }
  }

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
                Quản lý{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                  Đơn đặt món
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Nhận đơn mới, chấp nhận/từ chối và xem chi tiết theo bàn.
              </p>
            </div>

            <button
              onClick={refresh}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã đơn (OD-...), bàn (T05), hoặc tên món..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all shadow-lg"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-200 outline-none"
              >
                <option value="pending">Chờ xử lý</option>
                <option value="accepted">Đã chấp nhận</option>
                <option value="rejected">Đã từ chối</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24">
        {isLoading ? (
          <SkeletonList />
        ) : filteredOrders.length === 0 ? (
          <EmptyState statusFilter={statusFilter} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={() => setSelectedOrder(order)}
                onAccept={() => onAccept(order.id)}
                onReject={() => onReject(order.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAccept={() => onAccept(selectedOrder.id)}
          onReject={() => onReject(selectedOrder.id)}
        />
      )}
    </div>
  );
}

function EmptyState({ statusFilter }) {
  const title =
    statusFilter === "pending"
      ? "Chưa có đơn chờ xử lý"
      : statusFilter === "accepted"
        ? "Chưa có đơn đã chấp nhận"
        : statusFilter === "rejected"
          ? "Chưa có đơn đã từ chối"
          : "Chưa có đơn nào";

  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <Receipt className="text-orange-500" />
      </div>
      <div className="mt-4 text-white font-black text-xl">{title}</div>
      <p className="mt-2 text-gray-400 text-sm max-w-md mx-auto">
        Khi có khách đặt món, hệ thống sẽ hiện đơn ở đây và gửi thông báo tự động.
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-neutral-900/60 border border-white/10 p-5 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-5 w-40 bg-white/10 rounded" />
              <div className="mt-3 h-4 w-64 bg-white/10 rounded" />
              <div className="mt-4 h-4 w-56 bg-white/10 rounded" />
              <div className="mt-2 h-4 w-52 bg-white/10 rounded" />
            </div>
            <div className="h-10 w-24 bg-white/10 rounded" />
          </div>
          <div className="mt-5 flex gap-2">
            <div className="h-10 flex-1 bg-white/10 rounded-xl" />
            <div className="h-10 w-28 bg-white/10 rounded-xl" />
            <div className="h-10 w-32 bg-white/10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
