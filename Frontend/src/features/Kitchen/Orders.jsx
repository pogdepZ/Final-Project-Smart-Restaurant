import React, { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ChefHat,
  Search,
  Flame,
  Volume2,
  VolumeX,
  AlertTriangle,
} from "lucide-react";
import axiosClient from "../../store/axiosClient";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSound } from "../../hooks/useNotificationSound";
// import { formatMoneyVND } from "../../utils/orders";

import KitchenOrderCard from "../../Components/KitchenOrderCard";
import KitchenOrderDetailModal from "../../Components/KitchenOrderDetailModal";

export default function KitchenPage() {
  const socket = useSocket();
  const { play: playNotificationSound } = useNotificationSound(
    "/sounds/kitchen-order.mp3",
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true); // Toggle âm thanh

  // 1. Fetch Orders (Chỉ lấy status = preparing)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/orders?status=preparing");
      // console.log(">>>>>> Fetched Orders for Kitchen:", res);
      setOrders(Array.isArray(res) ? res : []);
      // lọc những item có status preparing
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: (order.items || []).filter(
            (item) => item.status === "preparing",
          ),
        })),
      );
      console.log(">>>>>> Filtered Orders:", orders);
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
      console.log(
        "🍳 [Kitchen] Received order update via socket:",
        updatedOrder,
      );

      if (updatedOrder.status === "preparing") {
        // Filter chỉ lấy items có status = "preparing" (giống fetchOrders)
        const preparingItems = (updatedOrder.items || []).filter(
          (item) => item.status === "preparing",
        );

        // Nếu không còn item nào cần nấu thì bỏ qua
        if (preparingItems.length === 0) {
          console.log("🍳 [Kitchen] No preparing items, skip this order");
          return;
        }

        const orderWithFilteredItems = {
          ...updatedOrder,
          items: preparingItems,
        };

        setOrders((prev) => {
          // Nếu đã có order này, cập nhật items
          const existingIndex = prev.findIndex((o) => o.id === updatedOrder.id);
          if (existingIndex !== -1) {
            const newOrders = [...prev];
            newOrders[existingIndex] = orderWithFilteredItems;
            return newOrders;
          }
          // Nếu chưa có, thêm mới vào đầu danh sách
          return [orderWithFilteredItems, ...prev];
        });

        // 🔔 Phát âm thanh thông báo
        if (soundEnabled) {
          playNotificationSound();
        }

        toast.info(`🍳 Nấu món mới: ${updatedOrder.table_number || "Mang về"}`);
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      }
    };

    const handlePaymentCompleted = (data) => {
      // setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
      fetchOrders();
      toast.success(`💰 Thanh toán xong: ${data.table_number || "Mang về"}`);

      console.log("🍽️ [Kitchen] Payment completed:", data);
    };

    socket.on("update_order", handleUpdateOrder);
    socket.on("payment_completed", handlePaymentCompleted);

    return () => {
      socket.off("update_order", handleUpdateOrder);
      socket.off("payment_completed", handlePaymentCompleted);
    };
  }, [socket, soundEnabled, playNotificationSound]); // <--- Dependency

  // Tính số đơn urgent (vượt prep time)
  const { urgentCount, filteredAndSorted } = useMemo(() => {
    const now = Date.now();

    // Filter theo search
    const q = search.trim().toLowerCase();
    let result = orders;
    if (q) {
      result = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.table_number || "").toLowerCase().includes(q) ||
          (o.items || []).some((it) => it.item_name?.toLowerCase().includes(q)),
      );
    }

    // Tính urgent cho từng order
    const withUrgency = result.map((order) => {
      const items = order.items || [];
      const maxPrepTime = Math.max(
        ...items.map((it) => it.prep_time_minutes || 15),
        15,
      );
      const elapsedMins = (now - new Date(order.created_at).getTime()) / 60000;
      const isUrgent = elapsedMins >= maxPrepTime;

      return { ...order, isUrgent, elapsedMins, maxPrepTime };
    });

    // Đếm số urgent
    const urgent = withUrgency.filter((o) => o.isUrgent).length;

    // Sắp xếp: urgent lên đầu, sau đó theo thời gian chờ (lâu nhất trước)
    const sorted = withUrgency.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return b.elapsedMins - a.elapsedMins; // Đơn chờ lâu hơn lên trước
    });

    return { urgentCount: urgent, filteredAndSorted: sorted };
  }, [orders, search]);

  // Actions
  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}`, { status });
      if (res) toast.success("Món đã xong! ✅");
      setSelected(null);
      fetchOrders();
      // Socket sẽ trả về update_order với status 'ready', tự động remove khỏi list
    } catch (e) {
      toast.error("Lỗi cập nhật");
    }
  };

  // Cập nhật status từng item
  const handleUpdateItemStatus = async (orderId, itemId, status) => {
    try {
      await axiosClient.patch(`/orders/items/${itemId}`, { status });

      // Cập nhật local state
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === itemId ? { ...item, status } : item,
            ),
          };
        }),
      );

      // Cập nhật selected order nếu đang mở
      if (selected?.id === orderId) {
        setSelected((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, status } : item,
          ),
        }));
      }

      toast.success("Đã cập nhật món! ✅");
    } catch (e) {
      toast.error("Lỗi cập nhật món");
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

            <div className="flex items-center gap-3">
              {/* 🔔 Nút Toggle Âm Thanh */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-all ${
                  soundEnabled
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                    : "bg-white/5 border-white/10 text-gray-500"
                }`}
                title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              {/* Urgent Counter */}
              {urgentCount > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse">
                  <AlertTriangle size={18} className="animate-bounce" />
                  <span className="text-sm font-bold">
                    {urgentCount} đơn trễ
                  </span>
                </div>
              )}

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200">
                <Flame size={18} className="text-orange-500" />
                <span className="text-sm">
                  Đang chờ:{" "}
                  <span className="font-bold text-white">{orders.length}</span>
                </span>
              </div>
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

      {/* Content - Sử dụng filteredAndSorted thay vì filtered */}
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải...</div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Hết đơn! Bếp nghỉ ngơi 😴
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
            {filteredAndSorted.map((o) => (
              <KitchenOrderCard
                key={o.id}
                order={o}
                onView={() => setSelected(o)}
                onComplete={() => handleUpdateStatus(o.id, "ready")}
                onStart={() => toast.info("Bắt đầu nấu...")}
                onUpdateItemStatus={handleUpdateItemStatus}
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
          onUpdateItemStatus={handleUpdateItemStatus}
        />
      )}
    </div>
  );
}
