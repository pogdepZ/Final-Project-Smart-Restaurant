import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";

/**
 * Custom hook để lắng nghe socket events cho customer
 * @param {boolean} notify - Có hiển thị popup thông báo (toast) hay không? Mặc định là true.
 * Truyền false nếu chỉ muốn lắng nghe dữ liệu cập nhật mà không hiện thông báo (tránh duplicate).
 */
const useCustomerSocket = (notify = true) => {
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    // --- Xử lý kết nối ---
    const handleConnect = () => {
      console.log("🟢 Customer Socket Connected:", socket.id);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔴 Customer Socket Disconnected");
      setIsConnected(false);
    };

    // --- Các hàm xử lý sự kiện (Event Handlers) ---

    // 1. Cập nhật trạng thái đơn hàng (chung)
    const handleOrderStatusUpdate = (data) => {
      console.log("📢 [Customer] Order Status Update:", data);
      setLastUpdate({ type: "order_status", data, timestamp: Date.now() });

      if (notify) {
        toast.info(
          `🍽️ ${data.message || "Đơn hàng của bạn đã được cập nhật!"}`,
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
      }
    };

    // 2. Cập nhật trạng thái từng món (Item)
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

        // Nếu bị từ chối thì hiện màu đỏ (error), còn lại màu xanh (success)
        if (data.status === "rejected") {
          toast.error(message, { position: "top-right", autoClose: 4000 });
        } else {
          toast.success(message, { position: "top-right", autoClose: 3000 });
        }
      }
    };

    // 3. Cập nhật hóa đơn
    const handleBillUpdate = (data) => {
      console.log("📢 [Customer] Bill Update:", data);
      setLastUpdate({ type: "bill_update", data, timestamp: Date.now() });

      if (notify) {
        toast.success(data.message || "💰 Hóa đơn đã được cập nhật!", {
          position: "top-right",
          autoClose: 3000,
        });
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
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
    };

    // 5. Thông báo chung cho bàn
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

    // Kiểm tra trạng thái hiện tại ngay lập tức
    if (socket.connected) {
      setIsConnected(true);
    }

    // --- Cleanup khi unmount hoặc notify thay đổi ---
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("order_status_update", handleOrderStatusUpdate);
      socket.off("order_item_status_update", handleOrderItemStatusUpdate);
      socket.off("bill_update", handleBillUpdate);
      socket.off("bill_request_confirmed", handleBillRequestConfirmed);
      socket.off("table_notification", handleTableNotification);
    };
  }, [socket, notify]); // Quan trọng: thêm notify vào đây

  return {
    socket,
    isConnected,
    lastUpdate,
  };
};

export default useCustomerSocket;