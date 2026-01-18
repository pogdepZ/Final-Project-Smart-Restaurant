import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useSelector } from "react-redux"; // Nếu bạn dùng Redux cho Auth
// Hoặc import { useAuth } from './AuthContext' nếu dùng Context

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  // Lấy user để biết role (Redux example)
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) return;

    // Kết nối
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    // Join Room logic...
    newSocket.on("connect", () => {
      console.log("🟢 Socket Connected:", newSocket.id);

      if (user.role === "admin" || user.role === "waiter") {
        // Admin & Waiter tham gia cả 2 để vừa quản lý vừa nhận đơn
        newSocket.emit("join_admin");
        newSocket.emit("join_kitchen");
      } else if (user.role === "kitchen") {
        // Bếp chỉ cần tham gia phòng bếp
        newSocket.emit("join_kitchen");
      } else if(user.role === "customer") {
        // Khách hàng tham gia phòng khách
        const tableCode = localStorage.getItem("tableCode");
        newSocket.emit("join_table", { tableCode: tableCode, userId: user.id });
      }
    });

    return () => newSocket.close();
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
