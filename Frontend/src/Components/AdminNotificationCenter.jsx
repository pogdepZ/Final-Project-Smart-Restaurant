import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ClipboardList,
  UtensilsCrossed,
  Receipt,
  Clock,
} from "lucide-react";
import { MdOutlineTableBar } from "react-icons/md";
import { useAdminNotification } from "../hooks/useAdminNotification";
import { formatVNTimeOnly } from "../utils/timezone";

// Icon mapping theo loại notification
const getNotificationIcon = (type) => {
  switch (type) {
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

// Màu sắc theo priority
const getPriorityStyles = (priority, type) => {
  if (type === "new_order" || type === "bill_request") {
    return "bg-orange-500/20 border-orange-500/30 text-orange-400";
  }
  switch (priority) {
    case "high":
      return "bg-red-500/20 border-red-500/30 text-red-400";
    case "medium":
      return "bg-blue-500/20 border-blue-500/30 text-blue-400";
    default:
      return "bg-green-500/20 border-green-500/30 text-green-400";
  }
};

// Component cho từng notification item
function NotificationItem({ notification, onRead, onRemove, onClick }) {
  const iconStyles = getPriorityStyles(
    notification.priority,
    notification.type,
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;

      return formatVNTimeOnly
        ? formatVNTimeOnly(timestamp)
        : date.toLocaleString("vi-VN");
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all cursor-pointer hover:bg-white/5 ${
        notification.read
          ? "bg-transparent border-white/5 opacity-60"
          : "bg-white/5 border-white/10"
      }`}
      onClick={() => onClick?.(notification)}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconStyles}`}
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-sm text-white truncate">
              {notification.title}
            </h4>
          </div>

          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">
              {formatTime(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead?.(notification.id);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition"
          >
            <Check className="w-3 h-3" />
            Đã đọc
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(notification.id);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <Trash2 className="w-3 h-3" />
          Xóa
        </button>
      </div>
    </div>
  );
}

// Main Component
export default function AdminNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useAdminNotification();

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle notification click - navigate to relevant page
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    switch (notification.type) {
      case "new_order":
      case "order_update":
        navigate("/admin/orders");
        break;
      case "table_update":
        navigate("/admin/tables");
        break;
      case "bill_request":
        navigate("/admin/orders");
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
      >
        <Bell className="w-5 h-5 text-gray-300" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-neutral-900 border-b border-white/10 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                Thông báo
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} chưa đọc`
                  : "Không có thông báo mới"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-green-400 transition"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition"
                  title="Xóa tất cả"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[calc(70vh-80px)] p-3 space-y-2">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chưa có thông báo nào</p>
                <p className="text-gray-600 text-xs mt-1">
                  Các thông báo về đơn hàng và bàn ăn sẽ hiển thị ở đây
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onRemove={removeNotification}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
