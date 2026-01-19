import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";

/**
 * Custom hook để lắng nghe socket events cho customer
 * Sử dụng ở CustomerLayout để nhận thông báo ở mọi trang
 */
const useCustomerSocket = () => {
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    // Kiểm tra trạng thái kết nối
    const handleConnect = () => {
      console.log("🟢 Customer Socket Connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔴 Customer Socket Disconnected");
      setIsConnected(false);
    };

    // Lắng nghe cập nhật trạng thái đơn hàng
    const handleOrderStatusUpdate = (data) => {
      console.log("📢 [Customer] Order Status Update:", data);
      setLastUpdate({ type: "order_status", data, timestamp: Date.now() });

      toast.info(`🍽️ ${data.message || "Đơn hàng của bạn đã được cập nhật!"}`, {
        position: "top-right",
        autoClose: 4000,
      });
    };

    // Lắng nghe cập nhật từng item trong đơn
    const handleOrderItemStatusUpdate = (data) => {
      console.log("📢 [Customer] Order Item Status Update:", data);
      setLastUpdate({ type: "order_item_status", data, timestamp: Date.now() });

      // Hiển thị thông báo dựa trên trạng thái
      const statusMessages = {
        preparing: "🔥 Món của bạn đang được chuẩn bị!",
        ready: "✅ Món của bạn đã sẵn sàng!",
        served: "🍽️ Món của bạn đã được phục vụ!",
        rejected: "❌ Món của bạn đã bị từ chối",
      };

      const message = statusMessages[data.status] || "Cập nhật món ăn!";

      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
      });
    };

    // Lắng nghe cập nhật hóa đơn
    const handleBillUpdate = (data) => {
      console.log("📢 [Customer] Bill Update:", data);
      setLastUpdate({ type: "bill_update", data, timestamp: Date.now() });

      toast.success(data.message || "💰 Hóa đơn đã được cập nhật!", {
        position: "top-right",
        autoClose: 3000,
      });
    };

    // Lắng nghe yêu cầu thanh toán được xác nhận
    const handleBillRequestConfirmed = (data) => {
      console.log("📢 [Customer] Bill Request Confirmed:", data);
      setLastUpdate({
        type: "bill_request_confirmed",
        data,
        timestamp: Date.now(),
      });

      toast.success(
        "✅ Yêu cầu thanh toán đã được xác nhận! Nhân viên sẽ đến ngay.",
        {
          position: "top-right",
          autoClose: 5000,
        },
      );
    };

    // Lắng nghe thông báo chung cho bàn
    const handleTableNotification = (data) => {
      console.log("📢 [Customer] Table Notification:", data);
      setLastUpdate({
        type: "table_notification",
        data,
        timestamp: Date.now(),
      });

      toast.info(data.message || "📢 Thông báo từ nhà hàng", {
        position: "top-right",
        autoClose: 4000,
      });
    };

    // Đăng ký các event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("order_status_update", handleOrderStatusUpdate);
    socket.on("order_item_status_update", handleOrderItemStatusUpdate);
    socket.on("bill_update", handleBillUpdate);
    socket.on("bill_request_confirmed", handleBillRequestConfirmed);
    socket.on("table_notification", handleTableNotification);

    // Kiểm tra trạng thái hiện tại
    if (socket.connected) {
      setIsConnected(true);
    }

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("order_status_update", handleOrderStatusUpdate);
      socket.off("order_item_status_update", handleOrderItemStatusUpdate);
      socket.off("bill_update", handleBillUpdate);
      socket.off("bill_request_confirmed", handleBillRequestConfirmed);
      socket.off("table_notification", handleTableNotification);
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    lastUpdate,
  };
};

export default useCustomerSocket;
