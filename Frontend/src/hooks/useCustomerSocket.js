import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";

// Giữ nguyên file âm thanh của bạn
const NOTIFICATION_SOUND = "/sounds/notification.mp3";

/**
 * Custom hook để lắng nghe socket events cho customer
 * @param {boolean} notify - Có hiển thị popup và phát âm thanh hay không?
 */
const useCustomerSocket = (notify = true) => {
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Dùng useRef để giữ instance của Audio
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

  // Hàm phát âm thanh (đã xử lý lỗi chặn autoplay)
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("Trình duyệt chặn tự động phát âm thanh (cần tương tác trước):", err);
      });
    }
  };

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const handleConnect = () => {
      console.log("🟢 Customer Socket Connected:", socket.id);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔴 Customer Socket Disconnected");
      setIsConnected(false);
    };

    // --- CÁC EVENT HANDLER ---

    // 1. Cập nhật trạng thái Đơn hàng (Order Status)
    const handleOrderStatusUpdate = (data) => {
      console.log("📢 [Customer] Order Status Update:", data);
      setLastUpdate({ type: "order_status", data, timestamp: Date.now() });

      if (notify) {
        toast.info(
          `🍽️ ${data.message || "Đơn hàng của bạn đã được cập nhật!"}`,
          { position: "top-right", autoClose: 4000 }
        );
        // Thêm âm thanh khi trạng thái đơn hàng thay đổi
        playSound();
      }
    };

    // 2. Cập nhật trạng thái Món ăn (Item Status)
    const handleOrderItemStatusUpdate = (data) => {
      console.log("📢 [Customer] Order Item Status Update:", data);
      setLastUpdate({ type: "order_item_status", data, timestamp: Date.now() });

      if (notify) {
        const statusMessages = {
          preparing: "🔥 Món của bạn đang được chuẩn bị!",
          ready: "✅ Món của bạn đã sẵn sàng!",
          served: "🍽️ Món của bạn đã được phục vụ!",
          rejected: "❌ Món của bạn đã bị từ chối",
        };

        const message = statusMessages[data.status] || "Cập nhật món ăn!";

        if (data.status === "rejected") {
          toast.error(message, { position: "top-right", autoClose: 4000 });
        } else {
          toast.success(message, { position: "top-right", autoClose: 3000 });
        }

        // LOGIC SỬA ĐỔI: Chỉ phát âm thanh khi món Sẵn sàng, Phục vụ hoặc Bị từ chối.
        // Không phát khi "preparing" để tránh ồn ào.
        if (["ready", "served", "rejected"].includes(data.status)) {
          playSound();
        }
      }
    };

    // 3. Cập nhật Hóa đơn (Bill Update)
    const handleBillUpdate = (data) => {
      console.log("📢 [Customer] Bill Update:", data);
      setLastUpdate({ type: "bill_update", data, timestamp: Date.now() });

      if (notify) {
        toast.success(data.message || "💰 Hóa đơn đã được cập nhật!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Thêm âm thanh khi thanh toán xong
        playSound();
      }
    };

    // 4. Xác nhận yêu cầu thanh toán
    const handleBillRequestConfirmed = (data) => {
      console.log("📢 [Customer] Bill Request Confirmed:", data);
      setLastUpdate({
        type: "bill_request_confirmed",
        data,
        timestamp: Date.now(),
      });

      if (notify) {
        toast.success(
          "✅ Yêu cầu thanh toán đã được xác nhận! Nhân viên sẽ đến ngay.",
          { position: "top-right", autoClose: 5000 }
        );
        // Thêm âm thanh xác nhận
        playSound();
      }
    };

    // 5. Thông báo chung (Table Notification)
    const handleTableNotification = (data) => {
      console.log("📢 [Customer] Table Notification:", data);
      setLastUpdate({
        type: "table_notification",
        data,
        timestamp: Date.now(),
      });

      if (notify) {
        toast.info(data.message || "📢 Thông báo từ nhà hàng", {
          position: "top-right",
          autoClose: 4000,
        });
        // Thêm âm thanh cho thông báo
        playSound();
      }
    };

    // --- Đăng ký listeners ---
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("order_status_update", handleOrderStatusUpdate);
    socket.on("order_item_status_update", handleOrderItemStatusUpdate);
    socket.on("bill_update", handleBillUpdate);
    socket.on("bill_request_confirmed", handleBillRequestConfirmed);
    socket.on("table_notification", handleTableNotification);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("order_status_update", handleOrderStatusUpdate);
      socket.off("order_item_status_update", handleOrderItemStatusUpdate);
      socket.off("bill_update", handleBillUpdate);
      socket.off("bill_request_confirmed", handleBillRequestConfirmed);
      socket.off("table_notification", handleTableNotification);
    };
  }, [socket, notify]);

  return {
    socket,
    isConnected,
    lastUpdate,
  };
};

export default useCustomerSocket;