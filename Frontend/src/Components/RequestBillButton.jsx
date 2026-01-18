import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle, Loader2, Bell } from "lucide-react";
import { toast } from "react-toastify";
import { billRequestApi } from "../services/billRequestApi";
import { useSocket } from "../context/SocketContext";

const RequestBillButton = ({ tableId, sessionId, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const socket = useSocket();

  // Kiểm tra trạng thái ban đầu
  useEffect(() => {
    if (!tableId) return;

    const checkStatus = async () => {
      try {
        const res = await billRequestApi.getStatus(tableId);
        if (res.hasPendingRequest) {
          setRequested(true);
          if (res.request?.status === "acknowledged") {
            setAcknowledged(true);
          }
        }
      } catch (err) {
        console.error("Check bill request status error:", err);
      }
    };

    checkStatus();
  }, [tableId]);

  // Lắng nghe socket updates
  useEffect(() => {
    if (!socket || !tableId) return;

    const handleUpdate = (data) => {
      if (data.tableId === tableId) {
        if (data.type === "acknowledged") {
          setAcknowledged(true);
          toast.info("Nhân viên đang đến bàn của bạn!", {
            icon: "🏃",
          });
        }
      }
    };

    socket.on("bill_request_update", handleUpdate);
    return () => socket.off("bill_request_update", handleUpdate);
  }, [socket, tableId]);

  const handleRequest = async () => {
    if (requested) return;

    setLoading(true);
    try {
      const res = await billRequestApi.requestBill({
        tableId,
        sessionId,
      });

      setRequested(true);

      if (res.alreadyRequested) {
        toast.info("Yêu cầu đã được gửi trước đó. Vui lòng chờ!");
      } else {
        toast.success("Đã gửi yêu cầu thanh toán. Nhân viên sẽ đến ngay!", {
          icon: "🧾",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  // Đã có nhân viên xác nhận
  if (acknowledged) {
    return (
      <button
        disabled
        className={`px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-bold flex items-center justify-center gap-2 ${className}`}
      >
        <CheckCircle size={20} />
        Nhân viên đang đến
      </button>
    );
  }

  // Đã gửi yêu cầu, đang chờ
  if (requested) {
    return (
      <button
        disabled
        className={`px-6 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold flex items-center justify-center gap-2 animate-pulse ${className}`}
      >
        <Bell size={20} className="animate-bounce" />
        Đang chờ nhân viên...
      </button>
    );
  }

  // Chưa gửi yêu cầu
  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className={`px-6 py-3 rounded-xl bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95 disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Receipt size={20} />
      )}
      {loading ? "Đang gửi..." : "Yêu cầu thanh toán"}
    </button>
  );
};

export default RequestBillButton;
