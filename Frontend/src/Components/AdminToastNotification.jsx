import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, ClipboardList, Receipt, ExternalLink } from "lucide-react";
import { MdOutlineTableBar } from "react-icons/md";
import { useSocket } from "../context/SocketContext";
import { useNotificationSound } from "../hooks/useNotificationSound";

// Toast item component
function ToastItem({ notification, onClose, onNavigate }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(notification.id), 300);
  }, [onClose, notification.id]);

  // Auto close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  const getIcon = () => {
    switch (notification.type) {
      case "new_order":
      case "order_update":
        return <ClipboardList className="w-5 h-5" />;
      case "table_update":
        return <MdOutlineTableBar className="w-5 h-5" />;
      case "bill_request":
        return <Receipt className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case "new_order":
        return "border-orange-500/50 bg-orange-500/10";
      case "bill_request":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "order_update":
        return "border-blue-500/50 bg-blue-500/10";
      case "table_update":
        return "border-green-500/50 bg-green-500/10";
      default:
        return "border-white/20 bg-white/5";
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case "new_order":
        return "text-orange-400 bg-orange-500/20";
      case "bill_request":
        return "text-yellow-400 bg-yellow-500/20";
      case "order_update":
        return "text-blue-400 bg-blue-500/20";
      case "table_update":
        return "text-green-400 bg-green-500/20";
      default:
        return "text-gray-400 bg-white/10";
    }
  };

  return (
    <div
      className={`
        relative p-4 rounded-2xl border shadow-2xl shadow-black/50 backdrop-blur-xl
        transition-all duration-300 cursor-pointer
        ${getStyles()}
        ${isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}
      `}
      onClick={() => onNavigate(notification)}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor()}`}
        >
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white">{notification.title}</h4>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <ExternalLink className="w-3 h-3" />
            <span>Nhấn để xem chi tiết</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-b-2xl overflow-hidden">
        <div
          className="h-full bg-orange-500 animate-shrink-width"
          style={{ animationDuration: "5s" }}
        />
      </div>
    </div>
  );
}

// Main Toast Container
export default function AdminToastNotification() {
  const socket = useSocket();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);

  const { play: playNewOrderSound } = useNotificationSound(
    "/sounds/new-order.mp3",
  );
  const { play: playUpdateSound } = useNotificationSound(
    "/sounds/notification.mp3",
  );

  const addToast = (notification) => {
    const newToast = {
      id: Date.now() + Math.random(),
      ...notification,
    };
    setToasts((prev) => [...prev, newToast].slice(-5)); // Max 5 toasts
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (notification) => {
    removeToast(notification.id);

    switch (notification.type) {
      case "new_order":
      case "order_update":
      case "bill_request":
        navigate("/admin/orders");
        break;
      case "table_update":
        navigate("/admin/tables");
        break;
      default:
        break;
    }
  };

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      playNewOrderSound();
      addToast({
        type: "new_order",
        title: "🍽️ Đơn hàng mới!",
        message:
          data.message ||
          `Có đơn hàng mới từ Bàn ${data.order?.table_number || data.order?.table_id}`,
        data: data.order,
      });
    };

    const handleOrderUpdate = (data) => {
      playUpdateSound();
      const statusLabels = {
        received: "Đã tiếp nhận",
        preparing: "Đang chuẩn bị",
        ready: "Sẵn sàng phục vụ",
        completed: "Hoàn thành",
        rejected: "Đã hủy",
      };
      addToast({
        type: "order_update",
        title: "📋 Cập nhật đơn hàng",
        message:
          data.message ||
          `Đơn #${data.order?.id} - ${statusLabels[data.order?.status] || data.order?.status}`,
        data: data.order,
      });
    };

    const handleTableUpdate = (data) => {
      playUpdateSound();
      addToast({
        type: "table_update",
        title: "🪑 Cập nhật bàn",
        message:
          data.message || `Bàn ${data.table?.table_number} đã được cập nhật`,
        data: data.table,
      });
    };

    const handleBillRequest = (data) => {
      if (data.type === "new") {
        playNewOrderSound();
        addToast({
          type: "bill_request",
          title: "💰 Yêu cầu thanh toán",
          message: `Bàn ${data.request?.table_number} yêu cầu thanh toán`,
          data: data.request,
        });
      }
    };

    // Lắng nghe session bàn (khách quét QR)
    const handleTableSession = (data) => {
      playUpdateSound();
      const isStarted = data.type === "session_started";
      addToast({
        type: "table_update",
        title: isStarted ? "🟢 Khách mới vào bàn" : "⚪ Bàn đã trống",
        message: isStarted
          ? `Bàn ${data.table?.table_number} có khách mới!`
          : `Bàn ${data.table?.table_number} đã kết thúc phục vụ`,
        data: data.table,
      });
    };

    socket.on("admin_new_order", handleNewOrder);
    socket.on("admin_order_update", handleOrderUpdate);
    socket.on("admin_table_update", handleTableUpdate);
    socket.on("bill_request", handleBillRequest);
    socket.on("table_session_update", handleTableSession);

    return () => {
      socket.off("admin_new_order", handleNewOrder);
      socket.off("admin_order_update", handleOrderUpdate);
      socket.off("admin_table_update", handleTableUpdate);
      socket.off("bill_request", handleBillRequest);
      socket.off("table_session_update", handleTableSession);
    };
  }, [socket, playNewOrderSound, playUpdateSound]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 w-80">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          notification={toast}
          onClose={removeToast}
          onNavigate={handleNavigate}
        />
      ))}
    </div>
  );
}
