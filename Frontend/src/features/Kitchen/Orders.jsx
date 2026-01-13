import React, { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ChefHat, Search, Flame } from "lucide-react";
import axiosClient from "../../store/axiosClient";
import { useSocket } from "../../context/SocketContext";

import KitchenOrderCard from "../../Components/KitchenOrderCard";
import KitchenOrderDetailModal from "../../Components/KitchenOrderDetailModal";

export default function KitchenPage() {
  const socket = useSocket(); // <--- SỬ DỤNG HOOK

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // 1. Fetch Orders (Chỉ lấy status = preparing)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/orders?status=preparing");
      setOrders(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error("Lỗi tải đơn bếp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (!socket) return;

    const handleUpdateOrder = (updatedOrder) => {
      if (updatedOrder.status === 'preparing') {
        console.log(">>>>>> updatedOrder in KitchenPage SOCKET:", updatedOrder);
        setOrders(prev => {
            if (prev.find(o => o.id === updatedOrder.id)) return prev;
            toast.info(`🍳 Nấu món mới: ${updatedOrder.table_id}`);
            return [updatedOrder, ...prev];
        });
      } else {
        setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
      }
    };

    socket.on('update_order', handleUpdateOrder);

    return () => {
      socket.off('update_order', handleUpdateOrder);
    };
  }, [socket]); // <--- Dependency


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.table_number || "").toLowerCase().includes(q) ||
        (o.items || []).some((it) => it.item_name.toLowerCase().includes(q))
    );
  }, [orders, search]);

  // Actions
  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axiosClient.patch(`/orders/${orderId}`, { status });
      toast.success("Món đã xong! ✅");
      // Socket sẽ trả về update_order với status 'ready', tự động remove khỏi list
    } catch (e) {
      toast.error("Lỗi cập nhật");
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
                <ChefHat className="w-4 h-4 text-orange-500" />
                <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
                  Kitchen Console
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black mt-3">
                Danh sách Đơn cần làm
              </h1>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200">
              <Flame size={18} className="text-orange-500" />
              <span className="text-sm">
                Đang chờ:{" "}
                <span className="font-bold text-white">{orders.length}</span>
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Hết đơn! Bếp nghỉ ngơi 😴
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
            {filtered.map((o) => (
              <KitchenOrderCard
                key={o.id}
                order={o}
                onView={() => setSelected(o)}
                // Nút "Hoàn thành" -> Chuyển status sang 'ready'
                onComplete={() => handleUpdateStatus(o.id, "ready")}
                // Nút "Start" (Optional) -> Có thể thêm status 'cooking' nếu muốn chi tiết hơn
                onStart={() => toast.info("Bắt đầu nấu...")}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <KitchenOrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onComplete={() => handleUpdateStatus(selected.id, "ready")}
        />
      )}
    </div>
  );
}
