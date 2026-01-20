import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import io from "socket.io-client";
import { useSelector } from "react-redux"; // Nếu bạn dùng Redux cho Auth
// Hoặc import { useAuth } from './AuthContext' nếu dùng Context

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  // State để trigger reconnect khi qrToken thay đổi
  const [tableInfo, setTableInfo] = useState({
    tableCode: localStorage.getItem("tableCode"),
    qrToken: localStorage.getItem("qrToken"),
  });

  // Lấy user để biết role (Redux example)
  const { user } = useSelector((state) => state.auth);

  // Hàm để cập nhật tableInfo khi qrToken thay đổi (gọi từ bên ngoài nếu cần)
  const updateTableInfo = useCallback(() => {
    setTableInfo({
      tableCode: localStorage.getItem("tableCode"),
      qrToken: localStorage.getItem("qrToken"),
    });
  }, []);

  // Lắng nghe sự thay đổi của localStorage (cross-tab hoặc custom event)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "qrToken" || e.key === "tableCode") {
        updateTableInfo();
      }
    };

    // Custom event để component khác có thể trigger reconnect
    const handleQrTokenSet = () => {
      updateTableInfo();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("qrTokenSet", handleQrTokenSet);

    // Check lại sau một khoảng ngắn để đảm bảo localStorage đã được set
    const checkInterval = setInterval(() => {
      const currentQrToken = localStorage.getItem("qrToken");
      const currentTableCode = localStorage.getItem("tableCode");
      if (
        currentQrToken !== tableInfo.qrToken ||
        currentTableCode !== tableInfo.tableCode
      ) {
        updateTableInfo();
      }
    }, 1000); // Check mỗi giây

    // Dừng check sau 10 giây (đủ thời gian cho việc quét QR)
    setTimeout(() => clearInterval(checkInterval), 10000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("qrTokenSet", handleQrTokenSet);
      clearInterval(checkInterval);
    };
  }, [tableInfo.qrToken, tableInfo.tableCode, updateTableInfo]);

  useEffect(() => {
    const { tableCode, qrToken } = tableInfo;

    // Điều kiện kết nối: có user HOẶC có qrToken (khách quét QR không cần đăng nhập)
    const shouldConnect = user || qrToken;

    if (!shouldConnect) {
      // Nếu không cần kết nối, đóng socket cũ nếu có
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    // Nếu đã có socket và đang kết nối, không tạo lại
    if (socket?.connected) {
      // Chỉ join lại room nếu tableCode thay đổi
      if (tableCode && !user) {
        socket.emit("join_table", { tableCode: tableCode });
        console.log("🪑 Re-joined table:", tableCode);
      }
      return;
    }

    // Đóng socket cũ nếu có
    if (socket) {
      socket.close();
    }

    // Kết nối mới

    const newSocket = io(import.meta.env.VITE_APP_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(newSocket);

    // Join Room logic...
    newSocket.on("connect", () => {
      console.log("🟢 Socket Connected:", newSocket.id);

      if (user) {
        // User đã đăng nhập
        if (user.role === "admin" || user.role === "superadmin") {
          newSocket.emit("join_admin");
          console.log("🛡️ Admin joined admin room");
        } else if (user.role === "kitchen") {
          // Bếp chỉ cần tham gia phòng bếp
          newSocket.emit("join_kitchen");
          console.log("👩‍🍳 Kitchen joined kitchen room");
        } else if (user.role === "waiter") {
          newSocket.emit("join_waiter");
          console.log("👩‍🍳 Waiter joined waiter room");
        } else if (user.role === "customer") {
          // Khách hàng đã đăng nhập tham gia phòng khách
          if (tableCode) {
            newSocket.emit("join_table", {
              tableCode: tableCode,
              userId: user.id,
            });
            console.log("🪑 Customer joined table:", tableCode);
          }
        }
      } else if (qrToken && tableCode) {
        // Khách quét QR không đăng nhập - vẫn join room bàn
        newSocket.emit("join_table", { tableCode: tableCode });
        console.log("🪑 Guest joined table via QR:", tableCode);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [user, tableInfo]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
