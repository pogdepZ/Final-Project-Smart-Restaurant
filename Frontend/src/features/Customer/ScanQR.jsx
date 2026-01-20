import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Unlock, CheckCircle, AlertCircle, Utensils } from "lucide-react";
import { tableApi } from "../../services/tableApi";
import { toast } from "react-toastify";

const ScanQR = () => {
  const { tableCode } = useParams();
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const navigate = useNavigate();

  console.log("Scanned tableCode:", tableCode);

  const [status, setStatus] = useState("checking");
  const [bookingCode, setBookingCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [tableSession, setTableSession] = useState(null);

  // 1. KIỂM TRA VÀ TẠO SESSION BÀN TỪ SERVER
  useEffect(() => {
    const checkAndCreateSession = async () => {
      try {
        // Kiểm tra xem người dùng có bàn hay chưa
        const existingTableSession = await tableApi.findSessionActive(user?.id);

        console.log("existingTableSession:", existingTableSession);

        if (existingTableSession.hasSession && existingTableSession.sessions) {
          if (existingTableSession.sessions.tableId === tableCode) {
            // Nếu có rồi thì chuyển thẳng vào menu
            toast.success(
              `Bạn đã có phiên làm việc với bàn ${existingTableSession.sessions.tableNumber}. Đang chuyển đến thực đơn...`,
            );
            handleLoginSuccess(existingTableSession.sessions);
            return;
          } else {
            // Nếu có nhưng khác bàn thì báo lỗi
            setStatus("error");
            setErrorMessage(
              `Bạn đã có phiên làm việc với bàn ${existingTableSession.sessions.tableNumber}. Vui lòng kết thúc phiên làm việc hoặc thông báo cho nhân viên trước khi sử dụng bàn khác.`,
            );
            return;
          }
        }

        // Gọi API để kiểm tra bàn và tạo session mới

        const sessionId = localStorage.getItem("");

        const response = await tableApi.checkAndCreateSession(
          tableCode,
          user?.id,
        );

        console.log("checkAndCreateSession response:", response);

        if (response.success) {
          const { tableSession: session, requiresBookingCode } = response;

          // Nếu bàn đã đặt trước, yêu cầu nhập mã xác nhận
          if (requiresBookingCode) {
            setStatus("reserved");
            setTableSession(session);
          } else {
            // Session hợp lệ, cho vào menu
            handleLoginSuccess(session);
          }
        } else {
          // Session không hợp lệ
          setStatus("error");
          setErrorMessage(
            response.message ||
              "Bàn này không khả dụng hoặc session không hợp lệ.",
          );
        }
      } catch (error) {
        console.error("Error checking table session:", error);
        setStatus("error");

        // Xử lý các loại lỗi khác nhau
        if (error.response?.status === 400) {
          setErrorMessage("Bàn đang được sử dụng bởi khách khác.");
        } else if (error.response?.status === 404) {
          setErrorMessage("Mã bàn không tồn tại.");
        } else {
          setErrorMessage("Không thể kết nối đến server. Vui lòng thử lại.");
        }
      }
    };

    checkAndCreateSession();
  }, [tableCode]);

  // 2. HÀM XỬ LÝ KHI VÀO THÀNH CÔNG
  const handleLoginSuccess = (session) => {
    setStatus("success");

    // Lưu tableSession vào LocalStorage để các trang sau sử dụng
    localStorage.setItem("tableCode", tableCode);
    localStorage.setItem("tableSession", JSON.stringify(session));
    localStorage.setItem("tableSessionId", session.id);
    localStorage.setItem("sessionToken", session.sessionToken);
    localStorage.setItem("tableNumber", session.tableNumber);

    // Dispatch custom event để SocketContext biết cần kết nối lại
    window.dispatchEvent(new Event("qrTokenSet"));

    // Chuyển hướng sang Menu sau 1s
    setTimeout(() => {
      navigate(`/menu/${tableCode}`);
    }, 1000);
  };

  // 3. HÀM XỬ LÝ MỞ KHÓA BÀN ĐẶT TRƯỚC
  const handleUnlock = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // Gọi API xác thực mã đặt bàn và kích hoạt session
      const response = await tableApi.verifyBookingAndActivateSession(
        tableCode,
        bookingCode,
        user?.id,
      );

      if (response.success) {
        handleLoginSuccess(response.data.tableSession);
      } else {
        setErrorMessage(
          response.message || "Mã xác nhận không đúng. Vui lòng thử lại.",
        );
      }
    } catch (error) {
      console.error("Error verifying booking code:", error);
      if (error.response?.status === 401) {
        setErrorMessage("Mã xác nhận không đúng.");
      } else {
        setErrorMessage("Không thể xác thực. Vui lòng thử lại.");
      }
    }
  };

  // --- GIAO DIỆN ---

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-orange-500 via-red-500 to-orange-500 animate-gradient"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-sm">
        {/* TRẠNG THÁI 1: ĐANG KIỂM TRA */}
        {status === "checking" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils size={24} className="text-orange-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">
              Đang xác thực bàn {tableCode}...
            </h2>
            <p className="text-gray-400 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {/* TRẠNG THÁI 2: BÀN ĐÃ ĐẶT TRƯỚC (RESERVED) */}
        {status === "reserved" && (
          <div className="animate-slide-up bg-neutral-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Lock size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2">Bàn Đã Được Đặt</h2>
            <p className="text-gray-400 text-sm mb-6">
              Bàn <strong>{tableCode}</strong> đang được giữ chỗ. <br />
              Nhập mã đặt chỗ hoặc SĐT để mở khóa.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập mã (VD: 1234)"
                  className="w-full bg-neutral-950 border border-white/20 rounded-xl px-4 py-3.5 text-center text-lg font-bold tracking-widest focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:font-normal placeholder:tracking-normal"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  autoFocus
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={14} />
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-500/20"
              >
                <Unlock size={20} />
                Mở Khóa Bàn
              </button>
            </form>

            <button className="mt-6 text-gray-500 text-xs hover:text-orange-500 underline">
              Không có mã? Gọi nhân viên hỗ trợ
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 text-orange-500">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Xin Chào!</h2>
            <p className="text-gray-400">
              Bạn đã check-in vào bàn <strong>{tableCode}</strong>
            </p>
            <p className="text-orange-500 text-sm mt-4 font-medium animate-pulse">
              Đang chuyển đến thực đơn...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-gray-500">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-300">
              Lỗi Quét Mã
            </h2>
            <p className="text-gray-500 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Về Trang Chủ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQR;
