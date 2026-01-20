import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle, Bell, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { billRequestApi } from "../services/billRequestApi";
import { orderApi } from "../services/orderApi";
import { useSocket } from "../context/SocketContext";

const FloatingBillRequest = ({ tableId, sessionId }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | pending | acknowledged
  const socket = useSocket();

  // Kiểm tra trạng thái ban đầu
  useEffect(() => {
    if (!tableId) return;

    const checkStatus = async () => {
      try {
        const res = await billRequestApi.getStatus(tableId);
        if (res.hasPendingRequest) {
          setStatus(
            res.request?.status === "acknowledged" ? "acknowledged" : "pending",
          );
        }
      } catch (err) {
        console.error("Check status error:", err);
      }
    };

    checkStatus();
  }, [tableId]);

  // Lắng nghe socket
  useEffect(() => {
    if (!socket || !tableId) return;

    const handleUpdate = (data) => {
      if (String(data.tableId) === String(tableId)) {
        if (data.type === "acknowledged") {
          setStatus("acknowledged");
          toast.info(t("bill.staffComing"));
        }
      }
    };

    socket.on("bill_request_update", handleUpdate);
    return () => socket.off("bill_request_update", handleUpdate);
  }, [socket, tableId, t]);

  const handleRequest = async () => {
    if (status !== "idle") return;

    const user = localStorage.getItem("user");

    const userId = user ? JSON.parse(user).id : null;

    // console.log("Requesting bill with:", { tableId, sessionId, userId });

    const response = await orderApi.getUnpaidOrderByUserId(
      userId,
      tableId,
      sessionId,
    );

    if (response && response.success === false) {
      toast.error(response.message || t("bill.noOrderToRequest"));
      return;
    }

    setLoading(true);
    try {
      const res = await billRequestApi.requestBill({ tableId, sessionId });
      setStatus("pending");
      setIsOpen(false);

      if (res.alreadyRequested) {
        toast.info(t("bill.alreadyRequested"));
      } else {
        toast.success(t("bill.requestSent"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("bill.requestError"));
    } finally {
      setLoading(false);
    }
  };

  if (!tableId) return null;

  // Hiển thị trạng thái acknowledged
  if (status === "acknowledged") {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <div className="px-4 py-3 rounded-2xl bg-green-500/20 border border-green-500/30 text-green-400 font-bold flex items-center gap-2 shadow-lg animate-pulse">
          <CheckCircle size={20} />
          <span className="text-sm">{t("bill.staffOnTheWay")}</span>
        </div>
      </div>
    );
  }

  // Hiển thị trạng thái pending
  if (status === "pending") {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <div className="px-4 py-3 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold flex items-center gap-2 shadow-lg">
          <Bell size={20} className="animate-bounce" />
          <span className="text-sm">{t("bill.waitingForStaff")}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-linear-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
      >
        <Receipt size={24} />
      </button>

      {/* Modal xác nhận */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Receipt size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold">
                    {t("bill.requestBill")}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {t("bill.staffWillCome")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-gray-300 text-sm text-center mb-6">
                {t("bill.confirmRequestMessage")}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium transition-all"
                >
                  {t("bill.later")}
                </button>
                <button
                  onClick={handleRequest}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Receipt size={18} />
                  )}
                  {loading ? t("bill.sending") : t("bill.sendRequest")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingBillRequest;
