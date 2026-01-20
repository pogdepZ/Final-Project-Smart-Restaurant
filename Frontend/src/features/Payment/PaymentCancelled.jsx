import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  useEffect(() => {
    // Tự động redirect về trang chủ sau 8 giây
    const timer = setTimeout(() => {
      navigate("/");
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-neutral-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 rounded-3xl border border-red-500/30 p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle size={64} className="text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">
          Thanh toán đã hủy
        </h1>

        <p className="text-gray-400 mb-6">
          Bạn đã hủy thanh toán. Vui lòng thử lại hoặc chọn phương thức thanh
          toán khác.
        </p>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <p className="text-yellow-500 text-sm">
            💡 Nếu gặp vấn đề, vui lòng liên hệ nhân viên để được hỗ trợ.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-3"
        >
          <ArrowLeft size={20} />
          Thử lại thanh toán
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}
