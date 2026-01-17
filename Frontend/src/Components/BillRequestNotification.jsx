import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle, X, MapPin, Clock } from "lucide-react";
import { toast } from "react-toastify";
import { billRequestApi } from "../services/billRequestApi";
import { useSocket } from "../context/SocketContext";
import { formatVNTimeOnly } from "../utils/timezone";

const BillRequestNotification = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  // Fetch pending requests
  const fetchRequests = async () => {
    try {
      const data = await billRequestApi.getPending();
      setRequests(data);
    } catch (err) {
      console.error("Fetch bill requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Lắng nghe socket
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data) => {
      if (data.type === "new") {
        setRequests((prev) => [...prev, data.request]);
        // Play sound notification
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
        toast.info(`Bàn ${data.request.table_number} yêu cầu thanh toán!`, {
          icon: "🧾",
        });
      }
    };

    const handleUpdate = (data) => {
      if (data.type === "acknowledged") {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === data.request?.id ? { ...r, status: "acknowledged" } : r
          )
        );
      }
    };

    socket.on("bill_request", handleNewRequest);
    socket.on("bill_request_update", handleUpdate);

    return () => {
      socket.off("bill_request", handleNewRequest);
      socket.off("bill_request_update", handleUpdate);
    };
  }, [socket]);

  const handleAcknowledge = async (id) => {
    try {
      await billRequestApi.acknowledge(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "acknowledged" } : r))
      );
      toast.success("Đã xác nhận!");
    } catch (err) {
      toast.error("Lỗi xác nhận");
    }
  };

  const handleDismiss = async (id) => {
    try {
      await billRequestApi.cancel(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error("Lỗi hủy yêu cầu");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  if (pendingRequests.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {pendingRequests.map((req) => (
        <div
          key={req.id}
          className="bg-neutral-900 border border-orange-500/30 rounded-2xl p-4 shadow-2xl shadow-orange-500/10 animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Receipt size={20} className="text-orange-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">
                  {req.table_number}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                  YÊU CẦU BILL
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  {req.location || "—"}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatVNTimeOnly(req.created_at)}
                </div>
              </div>

              {req.note && (
                <div className="mt-2 text-sm text-gray-300 bg-white/5 p-2 rounded-lg">
                  {req.note}
                </div>
              )}
            </div>

            <button
              onClick={() => handleDismiss(req.id)}
              className="text-gray-500 hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleAcknowledge(req.id)}
              className="flex-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle size={16} />
              Đang đến
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BillRequestNotification;
