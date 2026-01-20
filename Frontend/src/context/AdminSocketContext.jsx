import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";

/**
 * Context để quản lý tất cả socket events cho Admin
 * Chỉ cần setup 1 lần trong AdminLayout, tất cả các trang/hook sẽ nhận được updates
 */
const AdminSocketContext = createContext(null);

export const AdminSocketProvider = ({ children }) => {
  const socket = useSocket();
  const [isConnected, setIsConnected] = useState(false);

  // State lưu trữ các loại update khác nhau
  const [orderUpdate, setOrderUpdate] = useState(null);
  const [tableUpdate, setTableUpdate] = useState(null);
  const [paymentUpdate, setPaymentUpdate] = useState(null);
  const [billRequestUpdate, setBillRequestUpdate] = useState(null);

  // Subscribers cho từng loại event
  const [orderSubscribers, setOrderSubscribers] = useState([]);
  const [tableSubscribers, setTableSubscribers] = useState([]);
  const [paymentSubscribers, setPaymentSubscribers] = useState([]);
  const [dashboardSubscribers, setDashboardSubscribers] = useState([]);

  // Hàm để subscribe vào các events
  const subscribeToOrders = useCallback((callback) => {
    setOrderSubscribers((prev) => [...prev, callback]);
    return () =>
      setOrderSubscribers((prev) => prev.filter((cb) => cb !== callback));
  }, []);

  const subscribeToTables = useCallback((callback) => {
    setTableSubscribers((prev) => [...prev, callback]);
    return () =>
      setTableSubscribers((prev) => prev.filter((cb) => cb !== callback));
  }, []);

  const subscribeToPayments = useCallback((callback) => {
    setPaymentSubscribers((prev) => [...prev, callback]);
    return () =>
      setPaymentSubscribers((prev) => prev.filter((cb) => cb !== callback));
  }, []);

  const subscribeToDashboard = useCallback((callback) => {
    setDashboardSubscribers((prev) => [...prev, callback]);
    return () =>
      setDashboardSubscribers((prev) => prev.filter((cb) => cb !== callback));
  }, []);

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const handleConnect = () => {
      console.log("🟢 Admin Socket Connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔴 Admin Socket Disconnected");
      setIsConnected(false);
    };

    // === ORDER EVENTS ===
    const handleNewOrder = (data) => {
      console.log("📢 [AdminSocket] New Order:", data);
      const update = { type: "new_order", data, timestamp: Date.now() };
      setOrderUpdate(update);
      // Notify all order subscribers
      orderSubscribers.forEach((cb) => cb(update));
      // Notify dashboard subscribers
      dashboardSubscribers.forEach((cb) => cb(update));
    };

    const handleOrderUpdate = (data) => {
      console.log("📢 [AdminSocket] Order Update:", data);
      const update = { type: "order_update", data, timestamp: Date.now() };
      setOrderUpdate(update);
      orderSubscribers.forEach((cb) => cb(update));
      dashboardSubscribers.forEach((cb) => cb(update));
    };

    // === TABLE EVENTS ===
    const handleTableUpdate = (data) => {
      console.log("📢 [AdminSocket] Table Update:", data);
      const update = { type: "table_update", data, timestamp: Date.now() };
      setTableUpdate(update);
      tableSubscribers.forEach((cb) => cb(update));
      dashboardSubscribers.forEach((cb) => cb(update));
    };

    const handleTableSessionUpdate = (data) => {
      console.log("📢 [AdminSocket] Table Session Update:", data);
      const update = {
        type: "table_session_update",
        data,
        timestamp: Date.now(),
      };
      setTableUpdate(update);
      tableSubscribers.forEach((cb) => cb(update));
      dashboardSubscribers.forEach((cb) => cb(update));
    };

    // === PAYMENT EVENTS ===
    const handlePaymentCompleted = (data) => {
      console.log("📢 [AdminSocket] Payment Completed:", data);
      const update = { type: "payment_completed", data, timestamp: Date.now() };
      setPaymentUpdate(update);
      paymentSubscribers.forEach((cb) => cb(update));
      dashboardSubscribers.forEach((cb) => cb(update));
      // Cũng notify orders vì thanh toán ảnh hưởng đến orders
      orderSubscribers.forEach((cb) => cb(update));
    };

    // === BILL REQUEST EVENTS ===
    const handleBillRequest = (data) => {
      console.log("📢 [AdminSocket] Bill Request:", data);
      const update = { type: "bill_request", data, timestamp: Date.now() };
      setBillRequestUpdate(update);
      // Bill request cũng liên quan đến orders
      orderSubscribers.forEach((cb) => cb(update));
    };

    // Đăng ký tất cả listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Order events
    socket.on("admin_new_order", handleNewOrder);
    socket.on("admin_order_update", handleOrderUpdate);

    // Table events
    socket.on("table_update", handleTableUpdate);
    socket.on("admin_table_update", handleTableUpdate);
    socket.on("table_session_update", handleTableSessionUpdate);

    // Payment events
    socket.on("admin_payment_completed", handlePaymentCompleted);
    socket.on("payment_completed", handlePaymentCompleted);

    // Bill request
    // socket.on("bill_request", handleBillRequest);

    // Check trạng thái hiện tại
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("admin_new_order", handleNewOrder);
      socket.off("admin_order_update", handleOrderUpdate);
      socket.off("table_update", handleTableUpdate);
      socket.off("admin_table_update", handleTableUpdate);
      socket.off("table_session_update", handleTableSessionUpdate);
      socket.off("admin_payment_completed", handlePaymentCompleted);
      socket.off("payment_completed", handlePaymentCompleted);
    //   socket.off("bill_request", handleBillRequest);
    };
  }, [
    socket,
    orderSubscribers,
    tableSubscribers,
    paymentSubscribers,
    dashboardSubscribers,
  ]);

  const value = {
    socket,
    isConnected,
    // Last updates
    orderUpdate,
    tableUpdate,
    paymentUpdate,
    billRequestUpdate,
    // Subscribe functions
    subscribeToOrders,
    subscribeToTables,
    subscribeToPayments,
    subscribeToDashboard,
  };

  return (
    <AdminSocketContext.Provider value={value}>
      {children}
    </AdminSocketContext.Provider>
  );
};

// Hook để sử dụng AdminSocketContext
export const useAdminSocketContext = () => {
  const context = useContext(AdminSocketContext);
  if (!context) {
    console.warn(
      "useAdminSocketContext must be used within AdminSocketProvider",
    );
    return {
      socket: null,
      isConnected: false,
      orderUpdate: null,
      tableUpdate: null,
      paymentUpdate: null,
      billRequestUpdate: null,
      subscribeToOrders: () => () => {},
      subscribeToTables: () => () => {},
      subscribeToPayments: () => () => {},
      subscribeToDashboard: () => () => {},
    };
  }
  return context;
};
