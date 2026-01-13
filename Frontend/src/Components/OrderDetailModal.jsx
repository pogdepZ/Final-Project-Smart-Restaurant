import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, XCircle, Clock, Table2, 
  X, Check, Ban, AlertCircle 
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatMoneyVND, formatTime } from "../utils/orders";
import axiosClient from "../store/axiosClient";
import { toast } from "react-toastify";

export default function OrderDetailModal({ order: initialOrder, onClose, onAccept, onReject }) {
  // Dùng state nội bộ để cập nhật UI ngay lập tức khi thao tác món
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  if (!order) return null;

  // Hàm xử lý từng món (Accept/Reject Item)
  const handleItemAction = async (itemId, status) => {
    try {
      // 1. Gọi API Backend
      const res = await axiosClient.patch(`/orders/items/${itemId}`, { status });
      
      toast.success(status === 'accepted' ? "Đã nhận món" : "Đã từ chối món");

      // 2. Cập nhật State nội bộ để UI đổi màu ngay lập tức
      setOrder(prev => ({
        ...prev,
        // Nếu backend trả về order mới đã tính lại tiền thì dùng luôn, ko thì tự map items
        // Ở đây giả sử backend trả về { message, order: updatedOrder } hoặc chỉ update items
        items: prev.items.map(it => 
            it.id === itemId ? { ...it, status: status } : it
        ),
        // Nếu reject thì backend thường sẽ giảm tổng tiền, cập nhật lại total nếu có
        total_amount: res.order ? res.order.total_amount : prev.total_amount
      }));

    } catch (err) {
      console.error(err);
      toast.error("Lỗi cập nhật món");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 bg-white/5">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-white font-black text-xl">#{order.id.slice(0, 8)}</div>
              <StatusBadge status={order.status} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="inline-flex items-center gap-2">
                <Table2 size={16} className="text-orange-500" />
                <span className="font-semibold text-gray-200">
                  {order.table_number || "Mang về"}
                </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                <span>{formatTime(order.created_at)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Note chung */}
          {order.note && (
            <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm flex gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <div>
                <span className="font-bold uppercase text-xs block mb-1 opacity-70">Ghi chú của khách:</span>
                {order.note}
              </div>
            </div>
          )}

          {/* List Items */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Chi tiết món ăn</h4>
            
            {order.items.map((item) => (
              <div 
                key={item.id}
                className={`flex justify-between items-start p-4 rounded-xl border transition-all ${
                    item.status === 'rejected' 
                        ? 'bg-red-900/10 border-red-500/20 opacity-60' // Style cho món bị từ chối
                        : item.status === 'accepted'
                            ? 'bg-green-900/10 border-green-500/20' // Style cho món đã nhận
                            : 'bg-neutral-900/50 border-white/5 hover:border-white/10' // Style Pending
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="bg-white/10 text-white px-2 py-1 rounded text-sm font-bold">
                        {item.qty}x
                    </span>
                    <span className={`font-semibold text-lg ${item.status === 'rejected' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                        {item.name}
                    </span>
                  </div>

                  {/* Modifiers */}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="mt-1 ml-10 text-sm text-gray-400">
                        + {item.modifiers.map(m => m.name).join(', ')}
                    </div>
                  )}

                  {/* Item Note */}
                  {item.note && (
                    <div className="mt-1 ml-10 text-sm text-orange-400 italic">
                        "{item.note}"
                    </div>
                  )}

                  {/* Item Status Badge */}
                  <div className="ml-10 mt-2">
                    {item.status === 'accepted' && (
                        <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12}/> Đã nhận
                        </span>
                    )}
                    {item.status === 'rejected' && (
                        <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                            <XCircle size={12}/> Đã từ chối
                        </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Price or Actions */}
                <div className="flex flex-col items-end gap-2">
                    <div className={`font-bold ${item.status === 'rejected' ? 'text-gray-600 line-through' : 'text-white'}`}>
                        {formatMoneyVND(item.subtotal)}
                    </div>

                    {/* ACTION BUTTONS (Chỉ hiện khi item đang Pending và Đơn chưa hoàn thành) */}
                    {(item.status === 'pending' || !item.status) && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <div className="flex gap-2 mt-1">
                            <button 
                                onClick={() => handleItemAction(item.id, 'rejected')}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                                title="Từ chối món này (Hết hàng...)"
                            >
                                <Ban size={16} />
                            </button>
                            <button 
                                onClick={() => handleItemAction(item.id, 'accepted')}
                                className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 transition-colors"
                                title="Nhận món này"
                            >
                                <Check size={16} />
                            </button>
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-black/40">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400">Tổng cộng (Đã duyệt)</span>
            <span className="text-3xl font-black text-orange-500">
                {formatMoneyVND(order.total_amount)}
            </span>
          </div>

          <div className="flex gap-3">
            {order.status === "received" ? (
              <>
                <button
                  onClick={onReject}
                  className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <XCircle size={18} />
                  Hủy cả đơn
                </button>
                <button
                  onClick={onAccept}
                  className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                >
                  <CheckCircle2 size={18} />
                  Chuyển Bếp Nấu
                </button>
              </>
            ) : (
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                >
                  Đóng
                </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}