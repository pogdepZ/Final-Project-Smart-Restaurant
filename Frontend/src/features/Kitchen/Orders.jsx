import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ChefHat, Search, RefreshCw, Flame } from "lucide-react";

import { useKitchenOrdersMock } from "../../hooks/useKitchenOrdersMock";
import KitchenOrderCard from "../../Components/KitchenOrderCard";
import KitchenOrderDetailModal from "../../Components/KitchenOrderDetailModal";

export default function KitchenPage() {
  const { orders, isLoading, start, complete } = useKitchenOrdersMock();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.tableNumber || "").toLowerCase().includes(q) ||
        o.items.some((it) => it.name.toLowerCase().includes(q))
    );
  }, [orders, search]);

  function onStart(orderId) {
    start(orderId);
    toast.info("Bắt đầu thực hiện 🍳");
    if (selected?.id === orderId) {
      setSelected((prev) => (prev ? { ...prev, status: "cooking" } : prev));
    }
  }

  function onComplete(orderId) {
    complete(orderId);
    toast.success("Đã hoàn thành đơn ✅");
    if (selected?.id === orderId) setSelected(null);
  }

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
                Danh sách{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                  Đơn cần làm
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Chỉ hiển thị đơn waiter đã chấp nhận. Hoàn thành xong thì bấm “Hoàn thành”.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200">
              <Flame size={18} className="text-orange-500" />
              <span className="text-sm">
                Đang chờ: <span className="font-bold text-white">{orders.length}</span>
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã đơn, bàn, hoặc tên món..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24">
        {isLoading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
            {filtered.map((o) => (
              <KitchenOrderCard
                key={o.id}
                order={o}
                onView={() => setSelected(o)}
                onStart={() => onStart(o.id)}
                onComplete={() => onComplete(o.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <KitchenOrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onStart={() => onStart(selected.id)}
          onComplete={() => onComplete(selected.id)}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <ChefHat className="text-orange-500" />
      </div>
      <div className="mt-4 text-white font-black text-xl">Chưa có đơn cần làm</div>
      <p className="mt-2 text-gray-400 text-sm max-w-md mx-auto">
        Khi waiter chấp nhận đơn, đơn sẽ xuất hiện tại đây.
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
          <div className="h-5 w-44 bg-white/10 rounded" />
          <div className="mt-3 h-4 w-64 bg-white/10 rounded" />
          <div className="mt-4 h-4 w-56 bg-white/10 rounded" />
          <div className="mt-2 h-4 w-52 bg-white/10 rounded" />
          <div className="mt-5 h-10 w-full bg-white/10 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
